import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getAuthContext, unauthorizedJson } from "@/lib/api-auth";

function admin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

interface HourInput {
  day_of_week: number;
  open_time: string;
  close_time: string;
  is_closed: boolean;
}

export async function POST(req: NextRequest) {
  const { businessId, professionalId } = await getAuthContext();
  if (!businessId) return unauthorizedJson();

  const { hours } = await req.json() as { hours: HourInput[] };
  if (!Array.isArray(hours) || hours.length === 0) {
    return NextResponse.json({ error: "Horários inválidos." }, { status: 400 });
  }

  const db = admin();

  // Eliminar solo los horarios de esta profesional (no los de otras del mismo negocio)
  let deleteQuery = db.from("business_hours").delete().eq("business_id", businessId);
  if (professionalId) {
    deleteQuery = deleteQuery.eq("professional_id", professionalId);
  }
  await deleteQuery;

  const { error } = await db.from("business_hours").insert(
    hours.map((h) => ({
      business_id:     businessId,
      professional_id: professionalId ?? null,
      day_of_week:     h.day_of_week,
      open_time:       h.open_time,
      close_time:      h.close_time,
      is_closed:       h.is_closed,
    }))
  );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
