import { createSupabaseAdminClient } from "@/utils/supabase/admin";
import { NextRequest, NextResponse } from "next/server";
import { getAuthContext, unauthorizedJson } from "@/lib/api-auth";

export async function GET(req: NextRequest) {
  const { businessId, professionalId, role } = await getAuthContext();
  if (!businessId) return unauthorizedJson();

  const clientId = new URL(req.url).searchParams.get("client_id");

  let query = createSupabaseAdminClient()
    .from("appointments")
    .select(
      "id, starts_at, ends_at, status, price, notes, client_id, service_id, " +
      "client:client_id(id, name, phone), service:service_id(id, name, duration_minutes)"
    )
    .eq("business_id", businessId)
    .order("starts_at", { ascending: false });

  // Collaborators only see their own appointments; owners see all
  if (role === "collaborator" && professionalId) {
    query = query.eq("professional_id", professionalId);
  }

  if (clientId) query = query.eq("client_id", clientId);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}
