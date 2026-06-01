import { createSupabaseAdminClient } from "@/utils/supabase/admin";
import { NextResponse } from "next/server";
import { getAuthBusinessId, unauthorizedJson } from "@/lib/api-auth";

export async function GET() {
  const businessId = await getAuthBusinessId();
  if (!businessId) return unauthorizedJson();

  const { data, error } = await createSupabaseAdminClient()
    .from("businesses")
    .select("id, name, logo_url, category, phone, email, address, whatsapp_phone_number_id, whatsapp_number, whatsapp_accepted")
    .eq("id", businessId)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PATCH(request: Request) {
  const businessId = await getAuthBusinessId();
  if (!businessId) return unauthorizedJson();

  const body = await request.json();
  const { logo_url, whatsapp_accepted } = body;

  // Build update payload with only defined fields
  const update: Record<string, unknown> = {};
  if (logo_url !== undefined) update.logo_url = logo_url;
  if (whatsapp_accepted !== undefined) update.whatsapp_accepted = whatsapp_accepted;

  const { data, error } = await createSupabaseAdminClient()
    .from("businesses")
    .update(update)
    .eq("id", businessId)
    .select("id, name, logo_url, whatsapp_accepted")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
