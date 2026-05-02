import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("pt-PT", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Lisbon",
  });
}

function tomorrowRange(): { from: string; to: string } {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  const date = d.toISOString().split("T")[0]; // YYYY-MM-DD

  const next = new Date(d);
  next.setDate(next.getDate() + 1);
  const nextDate = next.toISOString().split("T")[0];

  return { from: `${date}T00:00:00`, to: `${nextDate}T00:00:00` };
}

export async function GET(req: NextRequest) {
  // Protect with CRON_SECRET — Make passes it as ?secret= or Authorization: Bearer <token>
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const bearer = (req.headers.get("authorization") ?? "").replace("Bearer ", "");
    const query = req.nextUrl.searchParams.get("secret") ?? "";
    if (bearer !== secret && query !== secret) {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }
  }

  const { from, to } = tomorrowRange();
  const db = adminClient();

  const { data, error } = await db
    .from("appointments")
    .select(
      "id, starts_at, client:client_id(name, phone), service:service_id(name), business:business_id(name)"
    )
    .eq("status", "pendente")
    .gte("starts_at", from)
    .lt("starts_at", to)
    .order("starts_at", { ascending: true });

  if (error) {
    console.error("[sms/daily-reminders]", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const reminders = (data ?? []).flatMap((appt) => {
    const client = appt.client as unknown as { name: string; phone: string } | null;
    const service = appt.service as unknown as { name: string } | null;
    const business = appt.business as unknown as { name: string } | null;

    if (!client?.phone) return []; // skip appointments without a reachable phone

    const time = formatTime(appt.starts_at);

    return [
      {
        appointment_id: appt.id,
        client_name: client.name,
        client_phone: client.phone,
        service_name: service?.name ?? "",
        business_name: business?.name ?? "",
        starts_at: appt.starts_at,
        // Ready-to-send message — Make passes this directly to Twilio
        sms_message: `Olá ${client.name}! Lembrete da ${business?.name ?? "sua marcação"}: amanhã às ${time} - ${service?.name ?? "marcação"}. Responda SIM para confirmar ou NÃO para cancelar.`,
      },
    ];
  });

  return NextResponse.json({ count: reminders.length, reminders });
}
