"use client";

import { useState, useEffect, useCallback } from "react";
import AppLayout from "@/components/AppLayout";
import { TrendingUp, TrendingDown, Plus, X } from "lucide-react";
import type { Transaction, TransactionType } from "@/lib/types";
import { fetchTransactions, createTransaction } from "./actions";

// --- Helpers de data ---

function isSameDay(dateStr: string, ref: Date): boolean {
  const d = new Date(dateStr);
  return (
    d.getFullYear() === ref.getFullYear() &&
    d.getMonth() === ref.getMonth() &&
    d.getDate() === ref.getDate()
  );
}

function isThisWeek(dateStr: string): boolean {
  const d = new Date(dateStr);
  const now = new Date();
  const dow = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - (dow === 0 ? 6 : dow - 1));
  monday.setHours(0, 0, 0, 0);
  return d >= monday;
}

function isThisMonth(dateStr: string): boolean {
  const d = new Date(dateStr);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
}

function fmt(n: number): string {
  return n.toLocaleString("pt-PT", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString("pt-PT", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// --- Modal de registo ---

function AddModal({
  type,
  onClose,
  onSave,
}: {
  type: TransactionType;
  onClose: () => void;
  onSave: (description: string, amount: number) => Promise<void>;
}) {
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const isEntrada = type === "entrada";
  const accentColor = isEntrada ? "#00B4D8" : "#f87171";

  async function handleSubmit() {
    setError("");
    const parsed = parseFloat(amount.replace(",", "."));
    if (!description.trim()) { setError("Escreva uma descrição."); return; }
    if (isNaN(parsed) || parsed <= 0) { setError("Escreva um valor válido."); return; }
    setSaving(true);
    try {
      await onSave(description.trim(), parsed);
    } catch {
      setError("Não foi possível guardar. Tente novamente.");
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.75)" }}
    >
      <div className="w-full max-w-sm rounded-2xl bg-[#1E293B] p-6 shadow-2xl space-y-5">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">
            {isEntrada ? "Nova Entrada" : "Nova Despesa"}
          </h2>
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="rounded-lg p-1 text-slate-500 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Descrição */}
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-400">
            O que foi?
          </label>
          <input
            type="text"
            autoFocus
            placeholder={isEntrada ? "Ex: Corte + brushing" : "Ex: Produtos de coloração"}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            className="w-full rounded-xl border border-white/10 bg-[#0F172A] px-4 py-3 text-base text-white placeholder-slate-600 transition-colors focus:border-[#00B4D8] focus:outline-none"
          />
        </div>

        {/* Valor */}
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-400">
            Valor (€)
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-slate-400">
              €
            </span>
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              className="w-full rounded-xl border border-white/10 bg-[#0F172A] py-3 pl-10 pr-4 text-2xl font-bold text-white placeholder-slate-600 transition-colors focus:border-[#00B4D8] focus:outline-none"
            />
          </div>
        </div>

        {error && (
          <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</p>
        )}

        {/* Botões */}
        <div className="flex gap-3 pt-1">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-white/10 py-3 font-medium text-slate-400 transition-colors hover:border-white/20 hover:text-white"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex-1 rounded-xl py-3 font-bold text-white transition-opacity disabled:opacity-50"
            style={{ backgroundColor: accentColor }}
          >
            {saving ? "A guardar…" : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}

// --- Card de resumo ---

function ResumoCard({
  label,
  amount,
  sub,
  accent,
}: {
  label: string;
  amount: number;
  sub: string;
  accent: string;
}) {
  return (
    <div className="rounded-2xl border border-white/5 bg-[#1E293B] p-5">
      <p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-slate-500">
        {label}
      </p>
      <p className="text-4xl font-black text-white">€{fmt(amount)}</p>
      <p className="mt-2 text-xs text-slate-500">{sub}</p>
      <div
        className="mt-3 h-0.5 w-10 rounded-full"
        style={{ backgroundColor: accent }}
      />
    </div>
  );
}

// --- Página principal ---

export default function FinanceiroPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<TransactionType | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await fetchTransactions();
      setTransactions(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleSave(description: string, amount: number) {
    await createTransaction({ type: modal!, amount, description });
    setModal(null);
    await load();
  }

  // Cálculos
  const today = new Date();

  const entradasHoje = transactions
    .filter((t) => t.type === "entrada" && isSameDay(t.created_at, today))
    .reduce((s, t) => s + t.amount, 0);

  const entradasSemana = transactions
    .filter((t) => t.type === "entrada" && isThisWeek(t.created_at))
    .reduce((s, t) => s + t.amount, 0);

  const entradasMes = transactions
    .filter((t) => t.type === "entrada" && isThisMonth(t.created_at))
    .reduce((s, t) => s + t.amount, 0);

  const despesasMes = transactions
    .filter((t) => t.type === "despesa" && isThisMonth(t.created_at))
    .reduce((s, t) => s + t.amount, 0);

  const utilidade = entradasMes - despesasMes;
  const utilidadePct = entradasMes > 0
    ? Math.round((utilidade / entradasMes) * 100)
    : 0;

  const recentes = [...transactions]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 30);

  const dataHoje = today.toLocaleDateString("pt-PT", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <AppLayout>
      <div className="p-6 space-y-6">

        {/* Cabeçalho */}
        <div>
          <h1 className="text-xl font-semibold text-white">Financeiro</h1>
          <p className="mt-0.5 text-sm capitalize text-slate-400">{dataHoje}</p>
        </div>

        {/* Botões de ação */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button
            onClick={() => setModal("entrada")}
            className="flex items-center justify-center gap-3 rounded-2xl bg-[#00B4D8] py-5 text-lg font-bold text-white shadow-lg transition-colors hover:bg-[#0090b0]"
          >
            <Plus size={24} strokeWidth={3} />
            Registar Entrada
          </button>
          <button
            onClick={() => setModal("despesa")}
            className="flex items-center justify-center gap-3 rounded-2xl border border-red-400/30 bg-[#263348] py-5 text-lg font-bold text-red-400 shadow-lg transition-colors hover:border-red-400/50 hover:bg-[#334155]"
          >
            <Plus size={24} strokeWidth={3} />
            Registar Despesa
          </button>
        </div>

        {loading ? (
          <div className="py-12 text-center text-sm text-slate-500">A carregar…</div>
        ) : (
          <>
            {/* Resumo */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <ResumoCard
                label="Hoje"
                amount={entradasHoje}
                sub="entradas do dia"
                accent="#00B4D8"
              />
              <ResumoCard
                label="Esta Semana"
                amount={entradasSemana}
                sub="entradas da semana"
                accent="#2DD4BF"
              />
              <ResumoCard
                label="Este Mês"
                amount={entradasMes}
                sub="entradas do mês"
                accent="#00B4D8"
              />

              {/* Utilidade Bruta */}
              <div className="rounded-2xl border border-white/5 bg-[#1E293B] p-5">
                <p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-slate-500">
                  Utilidade Bruta (mês)
                </p>
                <p
                  className="text-4xl font-black"
                  style={{ color: utilidade >= 0 ? "#2DD4BF" : "#f87171" }}
                >
                  €{fmt(utilidade)}
                </p>
                <p
                  className="mt-1 text-2xl font-bold"
                  style={{ color: utilidade >= 0 ? "#2DD4BF99" : "#f8717199" }}
                >
                  {utilidadePct}%
                </p>
                <p className="mt-2 text-xs text-slate-500">
                  €{fmt(despesasMes)} em despesas este mês
                </p>
                <div
                  className="mt-3 h-0.5 w-10 rounded-full"
                  style={{ backgroundColor: utilidade >= 0 ? "#2DD4BF" : "#f87171" }}
                />
              </div>
            </div>

            {/* Lista de transações */}
            <div className="rounded-2xl border border-white/5 bg-[#1E293B]">
              <div className="border-b border-white/5 px-5 py-4">
                <h2 className="text-sm font-semibold text-white">
                  Últimas Transações
                </h2>
              </div>

              {recentes.length === 0 ? (
                <div className="py-14 text-center text-sm text-slate-600">
                  Ainda não há transações registadas.
                  <br />
                  <span className="text-slate-700">
                    Use os botões acima para começar.
                  </span>
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {recentes.map((t) => {
                    const isEntrada = t.type === "entrada";
                    const color = isEntrada ? "#00B4D8" : "#f87171";
                    return (
                      <div key={t.id} className="flex items-center gap-4 px-5 py-3.5">
                        <div
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
                          style={{ backgroundColor: color + "22" }}
                        >
                          {isEntrada ? (
                            <TrendingUp size={16} style={{ color }} />
                          ) : (
                            <TrendingDown size={16} style={{ color }} />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-white">
                            {t.description}
                          </p>
                          <p className="text-xs text-slate-500">{fmtDate(t.created_at)}</p>
                        </div>
                        <p className="shrink-0 text-sm font-bold" style={{ color }}>
                          {isEntrada ? "+" : "−"}€{fmt(t.amount)}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {modal && (
        <AddModal
          type={modal}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}
    </AppLayout>
  );
}
