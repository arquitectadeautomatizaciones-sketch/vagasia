import { createSupabaseAdminClient } from "@/utils/supabase/admin";
import { NextResponse } from "next/server";
import { getAuthBusinessId, unauthorizedJson } from "@/lib/api-auth";

export async function GET() {
  const businessId = await getAuthBusinessId();
  if (!businessId) return unauthorizedJson();

  const { data, error } = await createSupabaseAdminClient()
    .from("businesses")
    .select("id, name, logo_url, category, phone, email, address")
    .eq("id", businessId)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PATCH(request: Request) {
  const businessId = await getAuthBusinessId();
  if (!businessId) return unauthorizedJson();

  const body = await request.json();
  const { logo_url } = body;

  const { data, error } = await createSupabaseAdminClient()
    .from("businesses")
    .update({ logo_url })
    .eq("id", businessId)
    .select("id, name, logo_url")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
