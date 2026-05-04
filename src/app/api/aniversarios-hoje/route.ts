import { createSupabaseAdminClient } from "@/utils/supabase/admin";
import { NextResponse } from "next/server";
import { getAuthBusinessId, unauthorizedJson } from "@/lib/api-auth";

export async function GET() {
  const businessId = await getAuthBusinessId();
  if (!businessId) return unauthorizedJson();

  const today = new Date();
  const month = today.getMonth() + 1;
  const day = today.getDate();

  const { data, error } = await createSupabaseAdminClient()
    .rpc("get_birthday_clients", {
      p_business_id: businessId,
      p_month: month,
      p_day: day,
    });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}
