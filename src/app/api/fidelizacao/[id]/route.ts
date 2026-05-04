import { createSupabaseAdminClient } from "@/utils/supabase/admin";
import { NextResponse } from "next/server";
import { getAuthBusinessId, unauthorizedJson } from "@/lib/api-auth";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const businessId = await getAuthBusinessId();
  if (!businessId) return unauthorizedJson();

  const body = await request.json();
  const { action, reward, goal } = body;

  const db = createSupabaseAdminClient();

  const { data: card } = await db
    .from("loyalty_cards")
    .select("id, total_stamps, goal")
    .eq("id", id)
    .eq("business_id", businessId)
    .single();

  if (!card) {
    return NextResponse.json({ error: "Cartão não encontrado." }, { status: 404 });
  }

  let update: Record<string, unknown> = {};

  if (action === "stamp") {
    if (card.total_stamps >= card.goal) {
      return NextResponse.json(
        { error: "Cartão já completo. Inicia um novo ciclo primeiro." },
        { status: 409 }
      );
    }
    update.total_stamps = card.total_stamps + 1;
  } else if (action === "reset") {
    update.total_stamps = 0;
  } else {
    if (reward !== undefined) update.reward = reward?.trim() || null;
    if (goal !== undefined) update.goal = Math.max(1, Number(goal));
  }

  const { data, error } = await db
    .from("loyalty_cards")
    .update(update)
    .eq("id", id)
    .select("*, client:client_id(name, phone)")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
