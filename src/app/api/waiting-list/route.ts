import { createSupabaseAdminClient } from "@/utils/supabase/admin";
import { NextResponse } from "next/server";
import { getAuthBusinessId, unauthorizedJson } from "@/lib/api-auth";

export async function GET() {
  const businessId = await getAuthBusinessId();
  if (!businessId) return unauthorizedJson();

  const { data, error } = await createSupabaseAdminClient()
    .from("waiting_list")
    .select(
      "id, business_id, client_id, service_id, preferred_date, " +
      "preferred_time_start, preferred_time_end, notes, notified, created_at, " +
      "client:client_id(id, name, phone), service:service_id(id, name)"
    )
    .eq("business_id", businessId)
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}
