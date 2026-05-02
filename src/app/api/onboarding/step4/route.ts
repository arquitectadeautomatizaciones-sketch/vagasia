import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getAuthBusinessId, unauthorizedJson } from "@/lib/api-auth";

function admin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

interface ApptInput {
  client_name: string;
  client_phone: string;
  service_id: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
}

function addMinutes(date: string, time: string, minutes: number): string {
  const [h, m] = time.split(":").map(Number);
  const total = h * 60 + m + minutes;
  const eh = Math.floor(total / 60) % 24;
  const em = total % 60;
  return `${date}T${String(eh).padStart(2, "0")}:${String(em).padStart(2, "0")}:00`;
}

export async function POST(req: NextRequest) {
  const businessId = await getAuthBusinessId();
  if (!businessId) return unauthorizedJson();

  const { appointments } = await req.json() as { appointments: ApptInput[] };
  if (!Array.isArray(appointments) || appointments.length === 0) {
    return NextResponse.json({ created: 0 });
  }

  const db = admin();
  let created = 0;

  for (const appt of appointments) {
    if (!appt.client_name?.trim() || !appt.client_phone?.trim() || !appt.service_id || !appt.date || !appt.time) continue;

    // Find or create client
    const phone = appt.client_phone.trim();
    const { data: existing } = await db
      .from("clients")
      .select("id")
      .eq("business_id", businessId)
      .eq("phone", phone)
      .maybeSingle();

    let clientId = existing?.id as string | undefined;
    if (!clientId) {
      const { data: newClient } = await db
        .from("clients")
        .insert({ business_id: businessId, name: appt.client_name.trim(), phone, total_appointments: 0, total_spent: 0 })
        .select("id")
        .single();
      clientId = newClient?.id;
    }
    if (!clientId) continue;

    // Get service duration and price
    const { data: service } = await db
      .from("services")
      .select("duration_minutes, price")
      .eq("id", appt.service_id)
      .eq("business_id", businessId)
      .single();
    if (!service) continue;

    const starts_at = `${appt.date}T${appt.time}:00`;
    const ends_at = addMinutes(appt.date, appt.time, service.duration_minutes);

    await db.from("appointments").insert({
      business_id: businessId,
      client_id: clientId,
      service_id: appt.service_id,
      starts_at,
      ends_at,
      status: "pendente",
      price: service.price,
    });

    created++;
  }

  return NextResponse.json({ created });
}
