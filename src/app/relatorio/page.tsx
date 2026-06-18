"use client";

import { useState, useEffect, useCallback } from "react";
import AppLayout from "@/components/AppLayout";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  CalendarDays,
  XCircle,
  RefreshCw,
  CheckCircle,
  Loader2,
  MessageCircle,
} from "lucide-react";

const MONTHS_PT = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

interface MonthlyReport {
  id: string;
  business_id: string;
  month: number;
  year: number;
  total_revenue: number;
  total_expenses: number;
  appointments_total: number;
  appointments_recovered: number;
  appointments_cancelled: number;
  satisfaction_qualidade: number;
  satisfaction_tempo_espera: number;
  satisfaction_simpatia: number;
  improvement_notes: string | null;
  created_at: string;
}

// ── Gráfico de barras SVG puro ────────────────────────────────────────────────
function BarChart({ reports }: { reports: MonthlyReport[] }) {
  const last6 = [...reports]
    .sort((a, b) => a.year !== b.year ? a.year - b.year : a.month - b.month)
    .slice(-6);

  if (last6.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-slate-600 text-sm">
        Sem dados suficientes para o gráfico.
      </div>
    );
  }

  const maxVal = Math.max(...last6.map((r) => r.total_revenue), 1);
  const chartH = 100;
  const barW   = 36;
  const gap    = 12;
  const totalW = last6.length * (barW + gap) - gap;

  return (
    <div className="overflow-x-auto">
      <svg
        width={totalW + 8}
        height={chartH + 40}
        className="overflow-visible"
        role="img"
        aria-label="Faturação dos últimos 6 meses"
      >
        {last6.map((r, i) => {
          const barH = Math.max(4, (r.total_revenue / maxVal) * chartH);
          const x    = i * (barW + gap);
          const y    = chartH - barH;
          return (
            <g key={`${r.year}-${r.month}`}>
              <rect
                x={x}
                y={y}
                width={barW}
                height={barH}
                rx={4}
                className="fill-[#00B4D8] opacity-80 hover:opacity-100 transition-opacity"
              />
              {/* Valor acima da barra */}
              <text
                x={x + barW / 2}
                y={y - 4}
                textAnchor="middle"
                className="fill-slate-400 text-[9px]"
                fontSize={9}
              >
                {r.total_revenue > 0 ? `€${r.total_revenue.toFixed(0)}` : ""}
              </text>
              {/* Label mês */}
              <text
                x={x + barW / 2}
                y={chartH + 16}
                textAnchor="middle"
                className="fill-slate-500"
                fontSize={9}
              >
                {MONTHS_PT[r.month - 1]?.slice(0, 3)}
              </text>
              <text
                x={x + barW / 2}
                y={chartH + 28}
                textAnchor="middle"
                className="fill-slate-600"
                fontSize={8}
              >
                {r.year}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ── Estrelas de satisfação ────────────────────────────────────────────────────
function Stars({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <svg key={s} width={14} height={14} viewBox="0 0 24 24" className={s <= Math.round(value) ? "fill-amber-400" : "fill-white/10"}>
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
      <span className="ml-1 text-xs text-slate-400">{value > 0 ? value.toFixed(1) : "—"}</span>
    </div>
  );
}

// ── Seta de tendência ─────────────────────────────────────────────────────────
function Trend({ current, previous }: { current: number; previous: number | undefined }) {
  if (previous === undefined || previous === null) return null;
  const diff = current - previous;
  if (Math.abs(diff) < 0.01) return <Minus size={13} className="text-slate-500 shrink-0" />;
  return diff > 0
    ? <TrendingUp  size={13} className="text-emerald-400 shrink-0" />
    : <TrendingDown size={13} className="text-red-400 shrink-0" />;
}

function TrendBadge({ current, previous, suffix = "" }: { current: number; previous: number | undefined; suffix?: string }) {
  if (previous === undefined || previous === null) return null;
  const diff = current - previous;
  if (Math.abs(diff) < 0.01) return null;
  const sign = diff > 0 ? "+" : "";
  const color = diff > 0 ? "text-emerald-400" : "text-red-400";
  return (
    <span className={`text-[10px] font-medium ${color}`}>
      {sign}{diff > 0 && suffix === "%" ? diff.toFixed(1) : Math.round(Math.abs(diff))}{suffix}
    </span>
  );
}

// ── "O próximo passo" — texto personalizado por problema prioritário ──────────
const WHATSAPP_CTA = "wa.me/351911816539";

function buildNextStep(report: MonthlyReport, previous: MonthlyReport | undefined): string {
  const cancelRate = report.appointments_total > 0
    ? report.appointments_cancelled / report.appointments_total
    : 0;
  const prevCancelRate = previous && previous.appointments_total > 0
    ? previous.appointments_cancelled / previous.appointments_total
    : undefined;
  const revenueDropped = previous !== undefined && report.total_revenue < previous.total_revenue * 0.9;
  const noRecovered = report.appointments_total > 0 && report.appointments_recovered === 0;

  // Prioridade 1: cancelamentos altos (>20%)
  if (cancelRate > 0.2) {
    const lost = Math.round(
      report.appointments_cancelled * (report.appointments_total > 0 ? report.total_revenue / report.appointments_total : 0)
    );
    return (
      `Este mês tiveste ${report.appointments_cancelled} marcações canceladas — ` +
      `uma perda estimada de €${lost} em faturação que podias ter aproveitado. ` +
      `Posso ajudá-la a resolver isto numa sessão de 60 minutos, com estratégias concretas para reduzir faltas e preencher vagas em aberto. ` +
      `Reserve aqui por €50: https://${WHATSAPP_CTA}`
    );
  }

  // Prioridade 2: faturação caiu mais de 10%
  if (revenueDropped && previous) {
    const diff = Math.round(previous.total_revenue - report.total_revenue);
    return (
      `A tua faturação desceu €${diff} em relação ao mês anterior — ` +
      `uma quebra que convém travar antes que se torne um padrão. ` +
      `Posso ajudá-la a identificar a causa e recuperar esse valor numa sessão de 60 minutos. ` +
      `Reserve aqui por €50: https://${WHATSAPP_CTA}`
    );
  }

  // Prioridade 3: qualidade de serviço baixa
  if (report.satisfaction_qualidade > 0 && report.satisfaction_qualidade < 3.5) {
    return (
      `Os teus clientes avaliaram a qualidade do serviço com ${report.satisfaction_qualidade.toFixed(1)}/5 este mês — ` +
      `uma nota que pode estar a impedir recomendações e fidelização. ` +
      `Posso ajudá-la a perceber o que está a acontecer e como melhorar numa sessão de 60 minutos. ` +
      `Reserve aqui por €50: https://${WHATSAPP_CTA}`
    );
  }

  // Prioridade 4: tempo de espera mal avaliado
  if (report.satisfaction_tempo_espera > 0 && report.satisfaction_tempo_espera < 3.5) {
    return (
      `O tempo de espera foi avaliado com ${report.satisfaction_tempo_espera.toFixed(1)}/5 — ` +
      `clientes que esperam demasiado raramente voltam. ` +
      `Posso ajudá-la a reorganizar os intervalos entre marcações numa sessão de 60 minutos. ` +
      `Reserve aqui por €50: https://${WHATSAPP_CTA}`
    );
  }

  // Prioridade 5: lista de espera não usada
  if (noRecovered) {
    return (
      `Este mês não recuperaste nenhuma vaga cancelada — ` +
      `cada cancelamento é dinheiro que podia ter ido para outro cliente da lista de espera. ` +
      `Posso ajudá-la a activar este processo numa sessão de 60 minutos. ` +
      `Reserve aqui por €50: https://${WHATSAPP_CTA}`
    );
  }

  // Prioridade 6: cancelamentos a subir vs mês anterior
  if (prevCancelRate !== undefined && cancelRate > prevCancelRate + 0.05) {
    return (
      `Os cancelamentos subiram este mês em relação ao anterior. ` +
      `Se esta tendência continuar, vai reflectir-se na faturação nos próximos meses. ` +
      `Posso ajudá-la a inverter isto numa sessão de 60 minutos. ` +
      `Reserve aqui por €50: https://${WHATSAPP_CTA}`
    );
  }

  // Default: crescimento
  return (
    `O teu negócio está a funcionar bem — e há sempre espaço para crescer mais. ` +
    `Numa sessão de 60 minutos posso ajudá-la a identificar a próxima alavanca de crescimento: ` +
    `novos serviços, fidelização ou aumento de preços. ` +
    `Reserve aqui por €50: https://${WHATSAPP_CTA}`
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function RelatorioPage() {
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1); // 1-based
  const [selectedYear,  setSelectedYear]  = useState(now.getFullYear());
  const [reports, setReports]   = useState<MonthlyReport[]>([]);
  const [loading, setLoading]   = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError]       = useState<string | null>(null);

  // Carregar todos os relatórios
  const loadReports = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/reports/monthly");
      if (!res.ok) throw new Error("Erro ao carregar relatórios.");
      const data: MonthlyReport[] = await res.json();
      setReports(data);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadReports(); }, [loadReports]);

  // Gerar relatório do mês selecionado
  async function generateReport() {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/reports/monthly", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ month: selectedMonth, year: selectedYear }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error ?? "Erro ao gerar relatório.");
      }
      await loadReports();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setGenerating(false);
    }
  }

  // Relatório atual e anterior
  const current = reports.find((r) => r.month === selectedMonth && r.year === selectedYear);
  const prevMonth = selectedMonth === 1 ? 12 : selectedMonth - 1;
  const prevYear  = selectedMonth === 1 ? selectedYear - 1 : selectedYear;
  const previous  = reports.find((r) => r.month === prevMonth && r.year === prevYear);

  // Taxa de confirmação
  const taxaConf    = current && current.appointments_total > 0
    ? Math.round(((current.appointments_total - current.appointments_cancelled) / current.appointments_total) * 100)
    : 0;
  const prevTaxaConf = previous && previous.appointments_total > 0
    ? Math.round(((previous.appointments_total - previous.appointments_cancelled) / previous.appointments_total) * 100)
    : undefined;

  // Oportunidades de melhoria
  const improvements: string[] = [];
  if (current?.improvement_notes) {
    improvements.push(...current.improvement_notes.split("\n").filter(Boolean));
  }

  // Anos disponíveis para o selector
  const currentYear = now.getFullYear();
  const years = [currentYear - 1, currentYear, currentYear + 1];

  return (
    <AppLayout>
      <div className="p-6 space-y-6 max-w-4xl">

        {/* ── Header ── */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-xl font-semibold text-white">Relatório Mensal</h1>
            <p className="text-sm text-slate-400 mt-0.5">Análise completa do desempenho do teu negócio</p>
          </div>

          {/* Selector de mês */}
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="rounded-lg border border-white/10 bg-[#1E293B] px-3 py-2 text-sm text-white outline-none focus:border-[#00B4D8]/50"
            >
              {MONTHS_PT.map((m, i) => (
                <option key={i + 1} value={i + 1}>{m}</option>
              ))}
            </select>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="rounded-lg border border-white/10 bg-[#1E293B] px-3 py-2 text-sm text-white outline-none focus:border-[#00B4D8]/50"
            >
              {years.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
            <button
              onClick={generateReport}
              disabled={generating || loading}
              className="flex items-center gap-2 rounded-lg bg-[#00B4D8] px-4 py-2 text-sm font-medium text-white hover:bg-[#0090b0] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {generating
                ? <><Loader2 size={14} className="animate-spin" /> A calcular…</>
                : <><RefreshCw size={14} /> Atualizar</>
              }
            </button>
          </div>
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        {/* ── Loading ── */}
        {loading ? (
          <div className="flex items-center gap-2 text-slate-500 text-sm py-8">
            <Loader2 size={16} className="animate-spin" />
            A carregar relatórios…
          </div>
        ) : !current ? (
          <div className="rounded-xl border border-white/5 bg-[#1E293B] p-8 text-center space-y-3">
            <p className="text-slate-400 text-sm">Ainda não há relatório para {MONTHS_PT[selectedMonth - 1]} {selectedYear}.</p>
            <button
              onClick={generateReport}
              disabled={generating}
              className="mx-auto flex items-center gap-2 rounded-lg bg-[#00B4D8] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#0090b0] disabled:opacity-50 transition-colors"
            >
              {generating ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
              Gerar relatório de {MONTHS_PT[selectedMonth - 1]}
            </button>
          </div>
        ) : (
          <div className="space-y-5">

            {/* ── Faturação principal ── */}
            <div className="rounded-xl border border-[#00B4D8]/20 bg-gradient-to-br from-[#00B4D8]/10 to-[#1E293B] p-6">
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Faturação Total</p>
              <div className="flex items-end gap-3">
                <p className="text-4xl font-bold text-white">
                  €{current.total_revenue.toLocaleString("pt-PT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                {previous && (
                  <div className="flex items-center gap-1 mb-1">
                    <Trend current={current.total_revenue} previous={previous.total_revenue} />
                    <TrendBadge current={current.total_revenue} previous={previous.total_revenue} />
                  </div>
                )}
              </div>
              {current.total_expenses > 0 && (
                <p className="text-xs text-slate-500 mt-1">
                  Despesas: €{current.total_expenses.toLocaleString("pt-PT", { minimumFractionDigits: 2 })}
                  {" · "}Lucro: €{(current.total_revenue - current.total_expenses).toLocaleString("pt-PT", { minimumFractionDigits: 2 })}
                </p>
              )}
              <p className="text-xs text-slate-500 mt-0.5">vs {MONTHS_PT[prevMonth - 1]} {prevYear}: €{(previous?.total_revenue ?? 0).toLocaleString("pt-PT", { minimumFractionDigits: 2 })}</p>
            </div>

            {/* ── 4 métricas ── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* Vagas totais */}
              <div className="rounded-xl border border-white/5 bg-[#1E293B] p-4 space-y-1">
                <div className="flex items-center gap-1.5 text-slate-400">
                  <CalendarDays size={14} />
                  <p className="text-xs">Vagas totais</p>
                </div>
                <p className="text-2xl font-bold text-white">{current.appointments_total}</p>
                <div className="flex items-center gap-1">
                  <Trend current={current.appointments_total} previous={previous?.appointments_total} />
                  <TrendBadge current={current.appointments_total} previous={previous?.appointments_total} />
                </div>
              </div>

              {/* Vagas recuperadas */}
              <div className="rounded-xl border border-white/5 bg-[#1E293B] p-4 space-y-1">
                <div className="flex items-center gap-1.5 text-slate-400">
                  <RefreshCw size={14} />
                  <p className="text-xs">Recuperadas</p>
                </div>
                <p className="text-2xl font-bold text-white">{current.appointments_recovered}</p>
                <div className="flex items-center gap-1">
                  <Trend current={current.appointments_recovered} previous={previous?.appointments_recovered} />
                  <TrendBadge current={current.appointments_recovered} previous={previous?.appointments_recovered} />
                </div>
              </div>

              {/* Taxa de confirmação */}
              <div className="rounded-xl border border-white/5 bg-[#1E293B] p-4 space-y-1">
                <div className="flex items-center gap-1.5 text-slate-400">
                  <CheckCircle size={14} />
                  <p className="text-xs">Confirmação</p>
                </div>
                <p className="text-2xl font-bold text-white">{taxaConf}%</p>
                <div className="flex items-center gap-1">
                  <Trend current={taxaConf} previous={prevTaxaConf} />
                  <TrendBadge current={taxaConf} previous={prevTaxaConf} suffix="%" />
                </div>
              </div>

              {/* Canceladas */}
              <div className="rounded-xl border border-white/5 bg-[#1E293B] p-4 space-y-1">
                <div className="flex items-center gap-1.5 text-slate-400">
                  <XCircle size={14} />
                  <p className="text-xs">Canceladas</p>
                </div>
                <p className="text-2xl font-bold text-white">{current.appointments_cancelled}</p>
                <div className="flex items-center gap-1">
                  {/* Para canceladas: seta invertida (menos é melhor) */}
                  {previous !== undefined && current.appointments_cancelled !== previous.appointments_cancelled && (
                    current.appointments_cancelled < previous.appointments_cancelled
                      ? <TrendingUp size={13} className="text-emerald-400 shrink-0" />
                      : <TrendingDown size={13} className="text-red-400 shrink-0" />
                  )}
                  <TrendBadge current={-current.appointments_cancelled} previous={previous ? -previous.appointments_cancelled : undefined} />
                </div>
              </div>
            </div>

            {/* ── Gráfico últimos 6 meses ── */}
            <div className="rounded-xl border border-white/5 bg-[#1E293B] p-5 space-y-3">
              <h2 className="text-sm font-semibold text-white">Faturação — últimos 6 meses</h2>
              <BarChart reports={reports} />
            </div>

            {/* ── Satisfação ── */}
            <div className="rounded-xl border border-white/5 bg-[#1E293B] p-5 space-y-4">
              <h2 className="text-sm font-semibold text-white">Satisfação dos Clientes</h2>
              {current.satisfaction_qualidade === 0 && current.satisfaction_tempo_espera === 0 && current.satisfaction_simpatia === 0 ? (
                <p className="text-sm text-slate-500">Sem respostas de satisfação neste mês.</p>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-300">Qualidade do serviço</span>
                    <Stars value={current.satisfaction_qualidade} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-300">Tempo de espera</span>
                    <Stars value={current.satisfaction_tempo_espera} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-300">Simpatia</span>
                    <Stars value={current.satisfaction_simpatia} />
                  </div>
                </div>
              )}
            </div>

            {/* ── Oportunidades de melhoria ── */}
            {improvements.length > 0 && (
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-5 space-y-3">
                <h2 className="text-sm font-semibold text-amber-400">⚠️ Oportunidades de Melhoria</h2>
                <ul className="space-y-2">
                  {improvements.map((note, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                      <span className="mt-0.5 text-amber-400 shrink-0">•</span>
                      {note}
                    </li>
                  ))}
                </ul>
              </div>
            )}

          </div>
        )}

        {/* ── O próximo passo ── */}
        {current && (
          <div className="rounded-xl border border-[#4ECDC4]/25 bg-gradient-to-br from-[#4ECDC4]/8 to-[#1E293B] p-6 space-y-4">
            <h2 className="text-sm font-semibold text-[#4ECDC4]">💡 O próximo passo</h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              {buildNextStep(current, previous)}
            </p>
            <a
              href={`https://${WHATSAPP_CTA}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-[#25D366] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#1ebe5d] transition-colors"
            >
              <MessageCircle size={15} />
              Reservar sessão por €50
            </a>
          </div>
        )}

      </div>
    </AppLayout>
  );
}
