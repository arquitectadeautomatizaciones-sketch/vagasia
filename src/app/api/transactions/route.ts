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

export async function GET() {
  const businessId = await getAuthBusinessId();
  if (!businessId) return unauthorizedJson();

  const { data, error } = await admin()
    .from("transactions")
    .select("*")
    .eq("business_id", businessId)
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const businessId = await getAuthBusinessId();
  if (!businessId) return unauthorizedJson();

  const body = await req.json();
  const { type, amount, description } = body;

  if (!["entrada", "despesa"].includes(type)) {
    return NextResponse.json({ error: "Tipo inválido" }, { status: 400 });
  }
  if (typeof amount !== "number" || amount <= 0) {
    return NextResponse.json({ error: "Valor inválido" }, { status: 400 });
  }
  if (!description?.trim()) {
    return NextResponse.json({ error: "Descrição obrigatória" }, { status: 400 });
  }

  const { data, error } = await admin()
    .from("transactions")
    .insert({ type, amount, description: description.trim(), business_id: businessId })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
