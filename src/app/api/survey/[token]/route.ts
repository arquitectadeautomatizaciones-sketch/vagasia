import { createSupabaseAdminClient } from "@/utils/supabase/admin";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const db = createSupabaseAdminClient();

  const { data: survey, error } = await db
    .from("surveys")
    .select("id, answered_at, client:client_id(name), business:business_id(name)")
    .eq("token", token)
    .single();

  if (error || !survey) {
    return NextResponse.json({ error: "Inquérito não encontrado." }, { status: 404 });
  }

  if (survey.answered_at) {
    return NextResponse.json({ error: "Este inquérito já foi respondido." }, { status: 409 });
  }

  const client = survey.client as unknown as { name: string } | null;
  const business = survey.business as unknown as { name: string } | null;

  return NextResponse.json({
    clientName: client?.name ?? null,
    businessName: business?.name ?? null,
  });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const body = await request.json();
  const { qualidade, tempo_espera, simpatia } = body;

  const valid = (v: unknown) => Number.isInteger(v) && (v as number) >= 1 && (v as number) <= 5;
  if (!valid(qualidade) || !valid(tempo_espera) || !valid(simpatia)) {
    return NextResponse.json({ error: "Avaliações inválidas." }, { status: 400 });
  }

  const db = createSupabaseAdminClient();

  const { data: survey } = await db
    .from("surveys")
    .select("id, answered_at")
    .eq("token", token)
    .single();

  if (!survey) {
    return NextResponse.json({ error: "Inquérito não encontrado." }, { status: 404 });
  }
  if (survey.answered_at) {
    return NextResponse.json({ error: "Este inquérito já foi respondido." }, { status: 409 });
  }

  const { error } = await db
    .from("surveys")
    .update({ qualidade, tempo_espera, simpatia, answered_at: new Date().toISOString() })
    .eq("token", token);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
