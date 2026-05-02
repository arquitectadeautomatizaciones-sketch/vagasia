import { NextRequest, NextResponse } from "next/server";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { createHmac } from "crypto";

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

function twiml(message: string): NextResponse {
  return new NextResponse(
    `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${message}</Message></Response>`,
    { status: 200, headers: { "Content-Type": "text/xml" } }
  );
}

function validateTwilioSignature(
  authToken: string,
  url: string,
  params: Record<string, string>,
  signature: string
): boolean {
  const sorted = Object.keys(params).sort();
  const str = url + sorted.map((k) => k + params[k]).join("");
  const expected = createHmac("sha1", authToken).update(str).digest("base64");
  return expected === signature;
}

function normalizePhone(phone: string): string {
  return phone.replace(/\s+/g, "");
}

function formatPhoneSpaced(phone: string): string {
  const m = phone.match(/^(\+351)(\d{3})(\d{3})(\d{3})$/);
  return m ? `${m[1]} ${m[2]} ${m[3]} ${m[4]}` : phone;
}

function parseIntent(text: string): "confirm" | "cancel" | null {
  const t = text
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
  if (["sim", "s", "yes", "y", "1"].includes(t)) return "confirm";
  if (["nao", "n", "no", "0", "cancelar", "cancel"].includes(t)) return "cancel";
  return null;
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-PT", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Lisbon",
  });
}

// Outbound SMS via Twilio REST API (no SDK needed)
async function sendSms(to: string, body: string): Promise<void> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !from) {
    console.error("[sms/webhook] Twilio credentials not fully configured — cannot send outbound SMS.");
    return;
  }

  const credentials = Buffer.from(`${accountSid}:${authToken}`).toString("base64");
  const res = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ From: from, To: to, Body: body }).toString(),
    }
  );

  if (!res.ok) {
    console.error("[sms/webhook] Twilio outbound error:", await res.text());
  }
}

interface CancelledAppointment {
  id: string;
  business_id: string;
  service_id: string | null;
  starts_at: string;
  ends_at: string;
  price: number;
  service: unknown;
}

// When a booking is cancelled, find the first eligible waiting-list entry,
// create a new pending appointment for them, and notify via SMS.
async function notifyWaitingList(
  db: SupabaseClient,
  appt: CancelledAppointment
): Promise<void> {
  const serviceName =
    (appt.service as { name: string } | null)?.name ?? "marcação";
  const apptDate = appt.starts_at.split("T")[0]; // YYYY-MM-DD

  // FIFO: first created, flexible date OR matching date, same service, not yet notified
  const { data: entries } = await db
    .from("waiting_list")
    .select("id, client_id, client:client_id(name, phone)")
    .eq("business_id", appt.business_id)
    .eq("service_id", appt.service_id)
    .eq("notified", false)
    .or(`preferred_date.is.null,preferred_date.eq.${apptDate}`)
    .order("created_at", { ascending: true })
    .limit(1);

  const entry = entries?.[0];
  if (!entry) return; // nobody waiting — nothing to do

  const waitingClient = entry.client as unknown as { name: string; phone: string } | null;
  if (!waitingClient?.phone) return;

  // Reserve the slot for the waiting-list client (pendente — awaiting their SIM/NÃO)
  await db.from("appointments").insert({
    business_id: appt.business_id,
    client_id: entry.client_id,
    service_id: appt.service_id,
    starts_at: appt.starts_at,
    ends_at: appt.ends_at,
    status: "pendente",
    price: appt.price,
    notes: "Vaga recuperada da lista de espera",
  });

  // Mark as notified so they aren't contacted again for this entry
  await db.from("waiting_list").update({ notified: true }).eq("id", entry.id);

  const dateLabel = formatDateTime(appt.starts_at);
  await sendSms(
    waitingClient.phone,
    `Olá ${waitingClient.name}! Surgiu uma vaga: ${serviceName} no dia ${dateLabel}. Responda SIM para confirmar ou NÃO para recusar.`
  );
}

async function handleMessage(from: string, body: string): Promise<NextResponse> {
  if (!from) return twiml("Número não reconhecido.");

  const intent = parseIntent(body);
  if (!intent) {
    return twiml(
      "Não percebi a sua resposta. Responda SIM para confirmar ou NÃO para cancelar a sua marcação."
    );
  }

  const db = adminClient();

  // Find client by phone (try both E.164 and spaced formats)
  const fromSpaced = formatPhoneSpaced(from);
  const { data: clients } = await db
    .from("clients")
    .select("id, name")
    .or(`phone.eq.${from},phone.eq.${fromSpaced}`)
    .limit(1);

  const client = clients?.[0];
  if (!client) {
    return twiml("Número não reconhecido no sistema. Contacte o negócio diretamente.");
  }

  // Fetch full appointment details needed for waiting-list recovery
  const { data: appointments } = await db
    .from("appointments")
    .select("id, starts_at, ends_at, service_id, price, business_id, service:service_id(name)")
    .eq("client_id", client.id)
    .eq("status", "pendente")
    .gte("starts_at", new Date().toISOString())
    .order("starts_at", { ascending: true })
    .limit(1);

  const appointment = appointments?.[0] as CancelledAppointment | undefined;
  if (!appointment) {
    return twiml("Não encontrámos marcações pendentes associadas a este número.");
  }

  const dateLabel = formatDateTime(appointment.starts_at);

  if (intent === "confirm") {
    await db.from("appointments").update({ status: "confirmada" }).eq("id", appointment.id);
    return twiml(`Marcação confirmada para ${dateLabel}. Até breve, ${client.name}!`);
  }

  // Cancel and immediately offer the slot to the waiting list
  await db.from("appointments").update({ status: "cancelada" }).eq("id", appointment.id);
  await notifyWaitingList(db, appointment);

  return twiml(
    `Marcação de ${dateLabel} cancelada. Se precisar remarcar, contacte-nos.`
  );
}

export async function POST(req: NextRequest) {
  const formText = await req.text();
  const params = Object.fromEntries(new URLSearchParams(formText));

  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (authToken) {
    const signature = req.headers.get("x-twilio-signature") ?? "";
    if (!validateTwilioSignature(authToken, req.url, params, signature)) {
      return new NextResponse("Forbidden", { status: 403 });
    }
  }

  const from = normalizePhone(params["From"] ?? "");
  const body = params["Body"] ?? "";
  return handleMessage(from, body);
}
