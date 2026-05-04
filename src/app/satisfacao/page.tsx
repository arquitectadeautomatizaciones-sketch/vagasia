"use client";

import { useState, useEffect, useCallback } from "react";
import AppLayout from "@/components/AppLayout";
import type { Client, Survey } from "@/lib/types";
import {
  Star,
  AlertTriangle,
  Plus,
  Copy,
  Check,
  Loader2,
  Sparkles,
  Clock,
  Heart,
  X,
} from "lucide-react";

interface Stats {
  total: number;
  avgQualidade: number | null;
  avgTempoEspera: number | null;
  avgSimpatia: number | null;
}

function ScoreBar({ value }: { value: number | null }) {
  if (value === null) return <div className="h-1.5 rounded-full bg-white/5 w-full" />;
  const pct = (value / 5) * 100;
  const color = value >= 4 ? "#2DD4BF" : value >= 3 ? "#00B4D8" : "#f87171";
  return (
    <div className="h-1.5 rounded-full bg-white/5 w-full overflow-hidden">
      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
    </div>
  );
}

function KpiCard({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: number | null;
  icon: React.ElementType;
  accent: string;
}) {
  const isLow = value !== null && value < 3;
  return (
    <div className={`rounded-xl border bg-[#1E293B] p-5 space-y-3 ${isLow ? "border-red-500/30" : "border-white/5"}`}>
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-slate-400">{label}</p>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ backgroundColor: accent + "22" }}>
          <Icon size={15} style={{ color: accent }} />
        </div>
      </div>
      <div className="flex items-end gap-2">
        <p className="text-3xl font-bold text-white">{value !== null ? value.toFixed(1) : "—"}</p>
        {value !== null && <p className="text-sm text-slate-500 mb-1">/ 5</p>}
      </div>
      <ScoreBar value={value} />
      {isLow && (
        <div className="flex items-center gap-1.5 text-[11px] text-red-400">
          <AlertTriangle size={11} />
          Abaixo do esperado
        </div>
      )}
    </div>
  );
}

function StarDisplay({ value }: { value: number | null }) {
  if (value === null) return <span className="text-slate-600 text-xs">—</span>;
  return (
    <div className="flex items-center gap-1">
      <Star size={12} fill="#00B4D8" className="text-[#00B4D8]" />
      <span className="text-sm font-semibold text-white">{value}</span>
    </div>
  );
}

function GenerateModal({ onClose, onGenerated }: { onClose: () => void; onGenerated: (url: string) => void }) {
  const [clients, setClients] = useState<Client[]>([]);
  const [clientId, setClientId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/clients")
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setClients(data); })
      .finally(() => setLoading(false));
  }, []);

  async function handleGenerate() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/satisfacao", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ client_id: clientId || null }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Erro ao gerar inquérito."); return; }
      const url = `${window.location.origin}/survey/${data.token}`;
      onGenerated(url);
    } catch {
      setError("Erro de ligação.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-[#1E293B] p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-white">Gerar Inquérito</h2>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-500 hover:text-white transition-colors">
            <X size={16} />
          </button>
        </div>
        <p className="text-sm text-slate-400">
          Cria um link de inquérito e partilha com a cliente por WhatsApp ou SMS.
        </p>
        <div className="space-y-1.5">
          <label className="text-xs text-slate-400">Cliente (opcional)</label>
          {loading ? (
            <div className="flex items-center gap-2 text-xs text-slate-500 py-2">
              <Loader2 size={12} className="animate-spin" /> A carregar clientes…
            </div>
          ) : (
            <select
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-[#0F172A] px-3.5 py-2.5 text-sm text-white outline-none focus:border-[#00B4D8]/50 transition-colors"
            >
              <option value="">Sem cliente específico</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          )}
        </div>
        {error && <p className="text-xs text-red-400">{error}</p>}
        <div className="flex gap-3 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-lg border border-white/10 py-2.5 text-sm text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleGenerate}
            disabled={saving}
            className="flex-1 rounded-lg bg-[#00B4D8] py-2.5 text-sm font-medium text-white hover:bg-[#0090b0] disabled:opacity-50 transition-colors"
          >
            {saving ? "A gerar…" : "Gerar link"}
          </button>
        </div>
      </div>
    </div>
  );
}

function LinkModal({ url, onClose }: { url: string; onClose: () => void }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-[#1E293B] p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-white">Link gerado!</h2>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-500 hover:text-white transition-colors">
            <X size={16} />
          </button>
        </div>
        <p className="text-sm text-slate-400">
          Copia o link e envia à cliente por WhatsApp, SMS ou email.
        </p>
        <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-[#0F172A] px-3 py-2.5">
          <p className="flex-1 text-xs text-slate-300 truncate">{url}</p>
          <button
            onClick={handleCopy}
            className="shrink-0 rounded-md bg-[#00B4D8]/15 px-2.5 py-1.5 text-xs font-medium text-[#00B4D8] hover:bg-[#00B4D8]/25 transition-colors flex items-center gap-1.5"
          >
            {copied ? <Check size={12} /> : <Copy size={12} />}
            {copied ? "Copiado!" : "Copiar"}
          </button>
        </div>
        <button
          onClick={onClose}
          className="w-full rounded-lg border border-white/10 py-2.5 text-sm text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
        >
          Fechar
        </button>
      </div>
    </div>
  );
}

export default function SatisfacaoPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recent, setRecent] = useState<Survey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showGenerate, setShowGenerate] = useState(false);
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);

  const load = useCallback(() => {
    fetch("/api/satisfacao")
      .then((r) => r.json())
      .then((data) => {
        if (data.error) { setError(data.error); return; }
        setStats(data.stats);
        setRecent(data.recent ?? []);
      })
      .catch(() => setError("Erro ao carregar dados."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const hasAlert =
    stats &&
    stats.total > 0 &&
    ((stats.avgQualidade !== null && stats.avgQualidade < 3) ||
      (stats.avgTempoEspera !== null && stats.avgTempoEspera < 3) ||
      (stats.avgSimpatia !== null && stats.avgSimpatia < 3));

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-white">Satisfação</h1>
            <p className="text-sm text-slate-400 mt-0.5">
              {stats ? `${stats.total} resposta${stats.total !== 1 ? "s" : ""} recebida${stats.total !== 1 ? "s" : ""}` : "A carregar…"}
            </p>
          </div>
          <button
            onClick={() => setShowGenerate(true)}
            className="flex items-center gap-2 rounded-lg bg-[#00B4D8] px-4 py-2 text-sm font-medium text-white hover:bg-[#0090b0] transition-colors shrink-0"
          >
            <Plus size={15} />
            Gerar Inquérito
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 size={24} className="animate-spin text-slate-600" />
          </div>
        ) : error ? (
          <div className="py-16 text-center text-sm text-red-400">{error}</div>
        ) : (
          <>
            {/* Alert */}
            {hasAlert && (
              <div className="flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/5 px-5 py-4">
                <AlertTriangle size={16} className="text-red-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-400">Atenção: KPI abaixo de 3</p>
                  <p className="text-xs text-red-400/70 mt-0.5">
                    Um ou mais indicadores estão abaixo do nível esperado. Revê as respostas recentes para identificar o problema.
                  </p>
                </div>
              </div>
            )}

            {/* KPI cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <KpiCard label="Qualidade do Serviço" value={stats?.avgQualidade ?? null} icon={Sparkles} accent="#00B4D8" />
              <KpiCard label="Tempo de Espera" value={stats?.avgTempoEspera ?? null} icon={Clock} accent="#2DD4BF" />
              <KpiCard label="Simpatia da Equipa" value={stats?.avgSimpatia ?? null} icon={Heart} accent="#00B4D8" />
            </div>

            {/* Recent responses */}
            <div className="rounded-xl border border-white/5 bg-[#1E293B] overflow-hidden">
              <div className="px-5 py-4 border-b border-white/5">
                <h2 className="text-sm font-semibold text-white">Últimas Respostas</h2>
              </div>

              {recent.length === 0 ? (
                <div className="py-12 text-center space-y-2">
                  <Star size={24} className="text-slate-700 mx-auto" />
                  <p className="text-sm text-slate-500">Ainda não há respostas.</p>
                  <p className="text-xs text-slate-600">Gera um inquérito e partilha com as tuas clientes.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/5 text-[11px] uppercase tracking-wider text-slate-500">
                        <th className="px-5 py-3 text-left font-semibold">Cliente</th>
                        <th className="px-5 py-3 text-left font-semibold hidden sm:table-cell">Data</th>
                        <th className="px-5 py-3 text-center font-semibold">Qualidade</th>
                        <th className="px-5 py-3 text-center font-semibold hidden md:table-cell">Espera</th>
                        <th className="px-5 py-3 text-center font-semibold hidden md:table-cell">Simpatia</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {recent.map((s) => {
                        const client = s.client as { name: string } | null;
                        return (
                          <tr key={s.id} className="hover:bg-white/2 transition-colors">
                            <td className="px-5 py-3.5">
                              <div className="flex items-center gap-2.5">
                                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#00B4D8]/15 text-[11px] font-semibold text-[#00B4D8]">
                                  {client ? client.name.charAt(0) : "?"}
                                </div>
                                <p className="text-sm text-white">{client?.name ?? "Anónimo"}</p>
                              </div>
                            </td>
                            <td className="px-5 py-3.5 text-xs text-slate-500 hidden sm:table-cell">
                              {s.answered_at
                                ? new Date(s.answered_at).toLocaleDateString("pt-PT", { day: "numeric", month: "short", year: "numeric" })
                                : "—"}
                            </td>
                            <td className="px-5 py-3.5 text-center">
                              <StarDisplay value={s.qualidade} />
                            </td>
                            <td className="px-5 py-3.5 text-center hidden md:table-cell">
                              <StarDisplay value={s.tempo_espera} />
                            </td>
                            <td className="px-5 py-3.5 text-center hidden md:table-cell">
                              <StarDisplay value={s.simpatia} />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {showGenerate && (
        <GenerateModal
          onClose={() => setShowGenerate(false)}
          onGenerated={(url) => {
            setShowGenerate(false);
            setGeneratedUrl(url);
          }}
        />
      )}

      {generatedUrl && (
        <LinkModal url={generatedUrl} onClose={() => setGeneratedUrl(null)} />
      )}
    </AppLayout>
  );
}
