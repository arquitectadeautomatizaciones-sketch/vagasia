import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export const DEMO_BUSINESS_ID = "00000000-0000-0000-0000-000000000001";

function admin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

export async function GET() {
  const { data, error } = await admin()
    .from("availability_exceptions")
    .select("*")
    .eq("business_id", DEMO_BUSINESS_ID)
    .order("date", { ascending: true })
    .order("start_time", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { data, error } = await admin()
    .from("availability_exceptions")
    .insert({ ...body, business_id: DEMO_BUSINESS_ID })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
