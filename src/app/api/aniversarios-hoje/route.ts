import { createSupabaseAdminClient } from "@/utils/supabase/admin";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const apiKey = request.headers.get("x-api-key");
  const expectedKey = process.env.VAGASIA_API_KEY;

  if (!expectedKey || !apiKey || apiKey !== expectedKey) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const businessId = searchParams.get("business_id");

  if (!businessId) {
    return NextResponse.json({ error: "Parâmetro business_id obrigatório." }, { status: 400 });
  }

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
