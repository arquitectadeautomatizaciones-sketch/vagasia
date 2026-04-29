import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const DEMO_BUSINESS_ID = "00000000-0000-0000-0000-000000000001";

function admin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

export async function GET() {
  const { data, error } = await admin()
    .from("services")
    .select("id, name, duration_minutes, price, active")
    .eq("business_id", DEMO_BUSINESS_ID)
    .eq("active", true)
    .order("name", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
