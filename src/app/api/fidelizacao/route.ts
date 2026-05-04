import { createSupabaseAdminClient } from "@/utils/supabase/admin";
import { NextResponse } from "next/server";
import { getAuthBusinessId, unauthorizedJson } from "@/lib/api-auth";

export async function GET() {
  const businessId = await getAuthBusinessId();
  if (!businessId) return unauthorizedJson();

  const { data, error } = await createSupabaseAdminClient()
    .from("loyalty_cards")
    .select("*, client:client_id(name, phone)")
    .eq("business_id", businessId)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(request: Request) {
  const businessId = await getAuthBusinessId();
  if (!businessId) return unauthorizedJson();

  const body = await request.json();
  const { client_id, reward, goal } = body;

  if (!client_id) {
    return NextResponse.json({ error: "client_id é obrigatório." }, { status: 400 });
  }

  const { data, error } = await createSupabaseAdminClient()
    .from("loyalty_cards")
    .insert({
      business_id: businessId,
      client_id,
      reward: reward?.trim() || null,
      goal: Math.max(1, Number(goal) || 10),
      total_stamps: 0,
    })
    .select("*, client:client_id(name, phone)")
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "Esta cliente já tem um cartão de fidelização." }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data, { status: 201 });
}
