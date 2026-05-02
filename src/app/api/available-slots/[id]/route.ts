import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { getAuthBusinessId, unauthorizedJson } from "@/lib/api-auth";

function admin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const businessId = await getAuthBusinessId();
  if (!businessId) return unauthorizedJson();
  const { id } = await params;
  const body = await req.json();

  const { data, error } = await admin()
    .from("available_slots")
    .update(body)
    .eq("id", id)
    .eq("business_id", businessId)
    .select("*, service:service_id(id, name, duration_minutes, price)")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const businessId = await getAuthBusinessId();
  if (!businessId) return unauthorizedJson();
  const { id } = await params;

  const { error } = await admin()
    .from("available_slots")
    .delete()
    .eq("id", id)
    .eq("business_id", businessId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return new NextResponse(null, { status: 204 });
}
