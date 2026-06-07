/**
 * GET  /api/reports/monthly
 *   Devolve todos os relatórios do negócio autenticado, ordenados por ano/mês desc.
 *
 * POST /api/reports/monthly
 *   Calcula e guarda (upsert) o relatório de um mês/ano.
 *   Body: { month: number, year: number }
 *   Também aceita chamadas internas de n8n via X-Api-Key + businessId no body:
 *   Body: { month, year, businessId }  +  Header X-Api-Key: [VAGASIA_API_KEY]
 */

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/utils/supabase/admin";
import { getAuthBusinessId, unauthorizedJson } from "@/lib/api-auth";

const sb = () => createSupabaseAdminClient();

// ── Auth helpers ─────────────────────────────────────────────────────────────

async function resolveBusinessId(req: NextRequest, body: Record<string, unknown>): Promise<string | null> {
  // Chamada interna (n8n) com API key + businessId no body
  const apiKey = req.headers.get("x-api-key");
  if (apiKey && apiKey === process.env.VAGASIA_API_KEY) {
    return (body.businessId as string) ?? null;
  }
  // Chamada normal autenticada
  return getAuthBusinessId();
}

// ── GET ──────────────────────────────────────────────────────────────────────

export async function GET() {
  const businessId = await getAuthBusinessId();
  if (!businessId) return unauthorizedJson();

  const { data, error } = await sb()
    .from("monthly_reports")
    .select("*")
    .eq("business_id", businessId)
    .order("year",  { ascending: false })
    .order("month", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

// ── POST ─────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({})) as Record<string, unknown>;
  const businessId = await resolveBusinessId(req, body);
  if (!businessId) return unauthorizedJson();

  const month = Number(body.month);
  const year  = Number(body.year);

  if (!month || !year || month < 1 || month > 12) {
    return NextResponse.json({ error: "month e year são obrigatórios (1–12)." }, { status: 400 });
  }

  // ── Intervalo do mês ─────────────────────────────────────────────────────
  const from = new Date(year, month - 1, 1).toISOString();
  const to   = new Date(year, month, 1).toISOString();      // início do mês seguinte

  const db = sb();

  // ── Queries em paralelo ──────────────────────────────────────────────────
  const [txRes, apptRes, surveyRes] = await Promise.all([
    // 1. Transações do mês
    db
      .from("transactions")
      .select("type, amount")
      .eq("business_id", businessId)
      .gte("created_at", from)
      .lt("created_at", to),

    // 2. Marcações do mês
    db
      .from("appointments")
      .select("status, is_recovered")
      .eq("business_id", businessId)
      .gte("starts_at", from)
      .lt("starts_at", to),

    // 3. Inquéritos respondidos no mês
    db
      .from("surveys")
      .select("qualidade, tempo_espera, simpatia")
      .eq("business_id", businessId)
      .gte("answered_at", from)
      .lt("answered_at", to)
      .not("answered_at", "is", null),
  ]);

  // ── Calcular métricas ────────────────────────────────────────────────────

  // Faturação
  const transactions = txRes.data ?? [];
  const total_revenue  = transactions
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + Number(t.amount ?? 0), 0);
  const total_expenses = transactions
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + Number(t.amount ?? 0), 0);

  // Marcações
  const appts = apptRes.data ?? [];
  const appointments_total     = appts.length;
  const appointments_recovered = appts.filter((a) => a.is_recovered === true).length;
  const appointments_cancelled = appts.filter((a) => a.status === "cancelada").length;

  // Satisfação
  const surveys = surveyRes.data ?? [];
  const avgField = (key: "qualidade" | "tempo_espera" | "simpatia") =>
    surveys.length > 0
      ? Math.round((surveys.reduce((s, r) => s + Number(r[key] ?? 0), 0) / surveys.length) * 10) / 10
      : 0;

  const satisfaction_qualidade    = avgField("qualidade");
  const satisfaction_tempo_espera = avgField("tempo_espera");
  const satisfaction_simpatia     = avgField("simpatia");

  // ── Oportunidades de melhoria ────────────────────────────────────────────
  const notes: string[] = [];
  if (satisfaction_qualidade    > 0 && satisfaction_qualidade    < 3.5)
    notes.push("Qualidade do serviço abaixo de 3.5 — pede feedback direto aos clientes.");
  if (satisfaction_tempo_espera > 0 && satisfaction_tempo_espera < 3.5)
    notes.push("Tempo de espera avaliado negativamente — revê os intervalos entre marcações.");
  if (satisfaction_simpatia     > 0 && satisfaction_simpatia     < 3.5)
    notes.push("Simpatia abaixo do esperado — considera um momento de reflexão com a equipa.");
  const improvement_notes = notes.join("\n") || null;

  // ── Upsert ───────────────────────────────────────────────────────────────
  const { data: report, error } = await db
    .from("monthly_reports")
    .upsert(
      {
        business_id: businessId,
        month,
        year,
        total_revenue,
        total_expenses,
        appointments_total,
        appointments_recovered,
        appointments_cancelled,
        satisfaction_qualidade,
        satisfaction_tempo_espera,
        satisfaction_simpatia,
        improvement_notes,
      },
      { onConflict: "business_id,month,year" }
    )
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(report);
}
