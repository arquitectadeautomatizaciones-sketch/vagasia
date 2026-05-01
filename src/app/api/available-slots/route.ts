import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { getAuthBusinessId, DEMO_BUSINESS_ID } from "@/lib/api-auth";

function admin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

export async function GET() {
  const businessId = (await getAuthBusinessId()) ?? DEMO_BUSINESS_ID;

  const { data, error } = await admin()
    .from("available_slots")
    .select("*, service:service_id(id, name, duration_minutes, price)")
    .eq("business_id", businessId)
    .order("date", { ascending: true })
    .order("start_time", { ascending: true });

  if (error) {
    console.error("[available-slots GET]", error.code, error.message);
    return NextResponse.json({ error: error.message, code: error.code }, { status: 500 });
  }
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const businessId = (await getAuthBusinessId()) ?? DEMO_BUSINESS_ID;

  const body = await req.json();
  const { data, error } = await admin()
    .from("available_slots")
    .insert({
      business_id: businessId,
      date: body.date,
      start_time: body.start_time,
      end_time: body.end_time,
      service_id: body.service_id || null,
      notes: body.notes || null,
      status: "disponivel",
    })
    .select("*, service:service_id(id, name, duration_minutes, price)")
    .single();

  if (error) {
    console.error("[available-slots POST]", error.code, error.message);
    return NextResponse.json({ error: error.message, code: error.code }, { status: 500 });
  }
  return NextResponse.json(data, { status: 201 });
}
