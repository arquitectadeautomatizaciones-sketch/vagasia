import { createSupabaseAdminClient } from "@/utils/supabase/admin";
import { NextResponse } from "next/server";
import { getAuthBusinessId, getAuthProfessionalId, unauthorizedJson } from "@/lib/api-auth";
import type { ProfessionalRole } from "@/lib/types";

export async function GET() {
  const businessId = await getAuthBusinessId();
  if (!businessId) return unauthorizedJson();

  const db = createSupabaseAdminClient();

  const { data, error } = await db
    .from("businesses")
    .select("id, name, logo_url, category, phone, email, address, whatsapp_phone_number_id, whatsapp_number, whatsapp_accepted, loyalty_enabled")
    .eq("id", businessId)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Role do utilizador: lê da tabela professionals via professional_id (app_metadata).
  // Fallback 'owner' para utilizadores sem professional_id (compatibilidade pré-migração).
  let role: ProfessionalRole = "owner";
  const professionalId = await getAuthProfessionalId();
  if (professionalId) {
    const { data: prof } = await db
      .from("professionals")
      .select("role")
      .eq("id", professionalId)
      .single();
    if (prof?.role === "owner" || prof?.role === "collaborator") {
      role = prof.role;
    }
  }

  return NextResponse.json({ ...data, role, professional_id: professionalId ?? null });
}

export async function PATCH(request: Request) {
  const businessId = await getAuthBusinessId();
  if (!businessId) return unauthorizedJson();

  const body = await request.json();
  const { logo_url, whatsapp_accepted, loyalty_enabled } = body;

  // Build update payload with only defined fields
  const update: Record<string, unknown> = {};
  if (logo_url          !== undefined) update.logo_url          = logo_url;
  if (whatsapp_accepted !== undefined) update.whatsapp_accepted = whatsapp_accepted;
  if (loyalty_enabled   !== undefined) update.loyalty_enabled   = !!loyalty_enabled;

  const { data, error } = await createSupabaseAdminClient()
    .from("businesses")
    .update(update)
    .eq("id", businessId)
    .select("id, name, logo_url, whatsapp_accepted, loyalty_enabled")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
