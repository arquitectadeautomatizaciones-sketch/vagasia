import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
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

// Strip spaces so "+351 912 345 678" and "+351912345678" both normalise to the same value
function normalizePhone(phone: string): string {
  return phone.replace(/\s+/g, "");
}

// Format E.164 Portuguese number back to spaced form for DB lookup
function formatPhoneSpaced(phone: string): string {
  const m = phone.match(/^(\+351)(\d{3})(\d{3})(\d{3})$/);
  return m ? `${m[1]} ${m[2]} ${m[3]} ${m[4]}` : phone;
}

function parseIntent(text: string): "confirm" | "cancel" | null {
  const t = text
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, ""); // strip diacritics: "não" → "nao"
  if (["sim", "s", "yes", "y", "1"].includes(t)) return "confirm";
  if (["nao", "n", "no", "0", "cancelar", "cancel"].includes(t)) return "cancel";
  return null;
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

  // Try both phone formats (E.164 and spaced) since storage varies
  const fromSpaced = formatPhoneSpaced(from);
  const { data: clients } = await db
    .from("clients")
    .select("id, name")
    .or(`phone.eq.${from},phone.eq.${fromSpaced}`)
    .limit(1);

  const client = clients?.[0];
  if (!client) {
    return twiml(
      "Número não reconhecido no sistema. Contacte o negócio diretamente."
    );
  }

  // Find the nearest future pending appointment for this client
  const { data: appointments } = await db
    .from("appointments")
    .select("id, starts_at")
    .eq("client_id", client.id)
    .eq("status", "pendente")
    .gte("starts_at", new Date().toISOString())
    .order("starts_at", { ascending: true })
    .limit(1);

  const appointment = appointments?.[0];
  if (!appointment) {
    return twiml(
      "Não encontrámos marcações pendentes associadas a este número."
    );
  }

  const newStatus = intent === "confirm" ? "confirmada" : "cancelada";
  await db.from("appointments").update({ status: newStatus }).eq("id", appointment.id);

  const dateLabel = new Date(appointment.starts_at).toLocaleDateString("pt-PT", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });

  if (intent === "confirm") {
    return twiml(`Marcação confirmada para ${dateLabel}. Até breve, ${client.name}!`);
  }
  return twiml(`Marcação de ${dateLabel} cancelada. Se precisar remarcar, contacte-nos.`);
}

export async function POST(req: NextRequest) {
  const formText = await req.text();
  const params = Object.fromEntries(new URLSearchParams(formText));

  // Validate Twilio signature when auth token is configured
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
