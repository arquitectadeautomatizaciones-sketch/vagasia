import { createSupabaseAdminClient } from "@/utils/supabase/admin";
import { NextResponse } from "next/server";
import { getAuthBusinessId, unauthorizedJson } from "@/lib/api-auth";

export async function GET() {
  const businessId = await getAuthBusinessId();
  if (!businessId) return unauthorizedJson();

  const db = createSupabaseAdminClient();

  const { data: surveys, error } = await db
    .from("surveys")
    .select("id, qualidade, tempo_espera, simpatia, answered_at, created_at, client:client_id(name, phone)")
    .eq("business_id", businessId)
    .not("answered_at", "is", null)
    .order("answered_at", { ascending: false })
    .limit(50);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const answered = surveys ?? [];
  const total = answered.length;

  const avg = (key: "qualidade" | "tempo_espera" | "simpatia") =>
    total > 0
      ? Math.round((answered.reduce((s, r) => s + (r[key] ?? 0), 0) / total) * 10) / 10
      : null;

  return NextResponse.json({
    stats: {
      total,
      avgQualidade: avg("qualidade"),
      avgTempoEspera: avg("tempo_espera"),
      avgSimpatia: avg("simpatia"),
    },
    recent: answered.slice(0, 20),
  });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));

  // Autenticação: API key (acesso externo) ou sessão (dashboard interno)
  let businessId: string | null = null;
  const apiKey = request.headers.get("x-api-key");
  const expectedKey = process.env.VAGASIA_API_KEY;

  if (apiKey) {
    if (!expectedKey || apiKey !== expectedKey) {
      return NextResponse.json({ error: "Não autorizado: x-api-key inválida." }, { status: 401 });
    }
    businessId = body.business_id ?? null;
    if (!businessId) {
      return NextResponse.json({ error: "Parâmetro business_id obrigatório." }, { status: 400 });
    }
  } else {
    businessId = await getAuthBusinessId();
    if (!businessId) return unauthorizedJson();
  }

  const { client_id } = body;

  const token = crypto.randomUUID();

  const { data, error } = await createSupabaseAdminClient()
    .from("surveys")
    .insert({
      business_id: businessId,
      client_id: client_id || null,
      appointment_id: null,
      token,
    })
    .select("token")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ token: data.token }, { status: 201 });
}
