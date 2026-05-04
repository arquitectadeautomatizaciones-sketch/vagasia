"use client";

import { useState, useEffect, useCallback } from "react";
import AppLayout from "@/components/AppLayout";
import type { Client, LoyaltyCard } from "@/lib/types";
import {
  Plus,
  Award,
  Gift,
  Settings,
  Loader2,
  X,
  RotateCcw,
  CheckCircle2,
} from "lucide-react";

function StampGrid({ total, goal, completed }: { total: number; goal: number; completed: boolean }) {
  return (
    <div className="flex flex-wrap gap-2">
      {Array.from({ length: goal }).map((_, i) => (
        <div
          key={i}
          className={`h-7 w-7 rounded-full border-2 transition-colors ${
            i < total
              ? completed
                ? "border-[#2DD4BF] bg-[#2DD4BF]"
                : "border-[#00B4D8] bg-[#00B4D8]"
              : "border-slate-600 bg-transparent"
          }`}
        />
      ))}
    </div>
  );
}

function NewCardModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (card: LoyaltyCard) => void;
}) {
  const [clients, setClients] = useState<Client[]>([]);
  const [clientId, setClientId] = useState("");
  const [reward, setReward] = useState("");
  const [goal, setGoal] = useState("10");
  const [loadingClients, setLoadingClients] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/clients")
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setClients(data); })
      .finally(() => setLoadingClients(false));
  }, []);

  async function handleCreate() {
    if (!clientId) { setError("Seleciona uma cliente."); return; }
    setSaving(true);
    setError(null);
    const res = await fetch("/api/fidelizacao", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ client_id: clientId, reward: reward || null, goal: Number(goal) || 10 }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error ?? "Erro ao criar ficha."); setSaving(false); return; }
    onCreated(data);
  }

  const inputClass =
    "w-full rounded-lg border border-white/10 bg-[#0F172A] px-3.5 py-2.5 text-sm text-white placeholder-slate-600 outline-none focus:border-[#00B4D8]/50 transition-colors";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-[#1E293B] p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-white">Nova Ficha de Fidelização</h2>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-500 hover:text-white transition-colors">
            <X size={16} />
          </button>
        </div>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs text-slate-400">Cliente *</label>
            {loadingClients ? (
              <div className="flex items-center gap-2 py-2 text-xs text-slate-500">
                <Loader2 size={12} className="animate-spin" /> A carregar clientes…
              </div>
            ) : (
              <select value={clientId} onChange={(e) => setClientId(e.target.value)} className={inputClass}>
                <option value="">Seleciona uma cliente</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            )}
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-slate-400">Recompensa</label>
            <input
              value={reward}
              onChange={(e) => setReward(e.target.value)}
              placeholder="Ex: 1 serviço grátis"
              className={inputClass}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-slate-400">Carimbos para completar</label>
            <input
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              type="number"
              min="1"
              max="50"
              className={inputClass}
            />
          </div>
        </div>
        {error && <p className="text-xs text-red-400">{error}</p>}
        <div className="flex gap-3 pt-1">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-white/10 py-2.5 text-sm text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleCreate}
            disabled={saving || loadingClients}
            className="flex-1 rounded-lg bg-[#00B4D8] py-2.5 text-sm font-medium text-white hover:bg-[#0090b0] disabled:opacity-50 transition-colors"
          >
            {saving ? "A criar…" : "Criar"}
          </button>
        </div>
      </div>
    </div>
  );
}

function EditCardModal({
  card,
  onClose,
  onUpdated,
}: {
  card: LoyaltyCard;
  onClose: () => void;
  onUpdated: (card: LoyaltyCard) => void;
}) {
  const [reward, setReward] = useState(card.reward ?? "");
  const [goal, setGoal] = useState(String(card.goal));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setError(null);
    const res = await fetch(`/api/fidelizacao/${card.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reward: reward || null, goal: Number(goal) || card.goal }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error ?? "Erro ao guardar."); setSaving(false); return; }
    onUpdated(data);
  }

  const inputClass =
    "w-full rounded-lg border border-white/10 bg-[#0F172A] px-3.5 py-2.5 text-sm text-white placeholder-slate-600 outline-none focus:border-[#00B4D8]/50 transition-colors";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-sm rounded-2xl border border-white/10 bg-[#1E293B] p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-white">Editar Ficha</h2>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-500 hover:text-white transition-colors">
            <X size={16} />
          </button>
        </div>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs text-slate-400">Recompensa</label>
            <input
              value={reward}
              onChange={(e) => setReward(e.target.value)}
              placeholder="Ex: 1 serviço grátis"
              className={inputClass}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-slate-400">Carimbos para completar</label>
            <input
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              type="number"
              min="1"
              max="50"
              className={inputClass}
            />
          </div>
        </div>
        {error && <p className="text-xs text-red-400">{error}</p>}
        <div className="flex gap-3 pt-1">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-white/10 py-2.5 text-sm text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 rounded-lg bg-[#00B4D8] py-2.5 text-sm font-medium text-white hover:bg-[#0090b0] disabled:opacity-50 transition-colors"
          >
            {saving ? "A guardar…" : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}

type Filter = "todos" | "progresso" | "completos";

export default function FidelizacaoPage() {
  const [cards, setCards] = useState<LoyaltyCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("todos");
  const [showNew, setShowNew] = useState(false);
  const [editCard, setEditCard] = useState<LoyaltyCard | null>(null);
  const [stampingId, setStampingId] = useState<string | null>(null);
  const [resetingId, setResetingId] = useState<string | null>(null);

  const load = useCallback(() => {
    fetch("/api/fidelizacao")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setCards(data);
        else setError(data.error ?? "Erro ao carregar.");
      })
      .catch(() => setError("Erro ao carregar."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleStamp(card: LoyaltyCard) {
    setStampingId(card.id);
    const res = await fetch(`/api/fidelizacao/${card.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "stamp" }),
    });
    const data = await res.json();
    if (res.ok) setCards((prev) => prev.map((c) => c.id === card.id ? data : c));
    setStampingId(null);
  }

  async function handleReset(card: LoyaltyCard) {
    setResetingId(card.id);
    const res = await fetch(`/api/fidelizacao/${card.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "reset" }),
    });
    const data = await res.json();
    if (res.ok) setCards((prev) => prev.map((c) => c.id === card.id ? data : c));
    setResetingId(null);
  }

  const filtered = cards.filter((c) => {
    const done = c.total_stamps >= c.goal;
    if (filter === "completos") return done;
    if (filter === "progresso") return !done;
    return true;
  });

  const completedCount = cards.filter((c) => c.total_stamps >= c.goal).length;

  const filterLabels: Record<Filter, string> = {
    todos: "Todos",
    progresso: "Em progresso",
    completos: "Completos",
  };

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-white">Fidelização</h1>
            <p className="text-sm text-slate-400 mt-0.5">
              {loading
                ? "A carregar…"
                : `${cards.length} ficha${cards.length !== 1 ? "s" : ""} · ${completedCount} completa${completedCount !== 1 ? "s" : ""}`}
            </p>
          </div>
          <button
            onClick={() => setShowNew(true)}
            className="flex items-center gap-2 rounded-lg bg-[#00B4D8] px-4 py-2 text-sm font-medium text-white hover:bg-[#0090b0] transition-colors shrink-0"
          >
            <Plus size={15} />
            Nova Ficha
          </button>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 rounded-lg border border-white/5 bg-[#1E293B] p-1 w-fit">
          {(["todos", "progresso", "completos"] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                filter === f ? "bg-[#00B4D8]/20 text-[#00B4D8]" : "text-slate-400 hover:text-white"
              }`}
            >
              {filterLabels[f]}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 size={24} className="animate-spin text-slate-600" />
          </div>
        ) : error ? (
          <div className="py-16 text-center text-sm text-red-400">{error}</div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-20">
            <Award size={32} className="text-slate-700" />
            <p className="text-sm text-slate-500">
              {filter === "todos" ? "Nenhuma ficha criada ainda." : "Nenhuma ficha nesta categoria."}
            </p>
            {filter === "todos" && (
              <button onClick={() => setShowNew(true)} className="text-xs text-[#00B4D8] hover:underline">
                Criar primeira ficha →
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((card) => {
              const completed = card.total_stamps >= card.goal;
              const client = card.client as { name: string; phone: string } | null;
              const isStamping = stampingId === card.id;
              const isReseting = resetingId === card.id;

              return (
                <div
                  key={card.id}
                  className={`rounded-xl border bg-[#1E293B] p-5 space-y-4 transition-colors ${
                    completed ? "border-[#2DD4BF]/30" : "border-white/5"
                  }`}
                >
                  {/* Card header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                          completed ? "bg-[#2DD4BF]/20 text-[#2DD4BF]" : "bg-[#00B4D8]/20 text-[#00B4D8]"
                        }`}
                      >
                        {client?.name.charAt(0) ?? "?"}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-white truncate">{client?.name ?? "—"}</p>
                        {completed && (
                          <div className="flex items-center gap-1 mt-0.5">
                            <CheckCircle2 size={11} className="text-[#2DD4BF]" />
                            <span className="text-[10px] font-semibold text-[#2DD4BF]">Cartão completo!</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => setEditCard(card)}
                      className="shrink-0 rounded-lg p-1.5 text-slate-600 hover:text-slate-400 hover:bg-white/5 transition-colors"
                    >
                      <Settings size={14} />
                    </button>
                  </div>

                  {/* Stamps visual */}
                  <StampGrid total={card.total_stamps} goal={card.goal} completed={completed} />

                  {/* Progress + reward */}
                  <div className="flex items-center justify-between gap-2">
                    <p className={`text-xs font-medium ${completed ? "text-[#2DD4BF]" : "text-slate-400"}`}>
                      {card.total_stamps}/{card.goal} carimbos
                    </p>
                    {card.reward && (
                      <div className="flex items-center gap-1 text-[11px] text-slate-500 min-w-0">
                        <Gift size={11} className="shrink-0" />
                        <span className="truncate">{card.reward}</span>
                      </div>
                    )}
                  </div>

                  {/* Action button */}
                  {completed ? (
                    <button
                      onClick={() => handleReset(card)}
                      disabled={isReseting}
                      className="w-full flex items-center justify-center gap-2 rounded-lg border border-[#2DD4BF]/30 py-2 text-xs font-medium text-[#2DD4BF] hover:bg-[#2DD4BF]/10 disabled:opacity-50 transition-colors"
                    >
                      {isReseting ? <Loader2 size={12} className="animate-spin" /> : <RotateCcw size={12} />}
                      Novo ciclo
                    </button>
                  ) : (
                    <button
                      onClick={() => handleStamp(card)}
                      disabled={isStamping}
                      className="w-full flex items-center justify-center gap-2 rounded-lg bg-[#00B4D8]/15 py-2 text-xs font-medium text-[#00B4D8] hover:bg-[#00B4D8]/25 disabled:opacity-50 transition-colors"
                    >
                      {isStamping ? <Loader2 size={12} className="animate-spin" /> : <Award size={12} />}
                      Carimbar
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showNew && (
        <NewCardModal
          onClose={() => setShowNew(false)}
          onCreated={(card) => {
            setCards((prev) => [card, ...prev]);
            setShowNew(false);
          }}
        />
      )}

      {editCard && (
        <EditCardModal
          card={editCard}
          onClose={() => setEditCard(null)}
          onUpdated={(updated) => {
            setCards((prev) => prev.map((c) => c.id === updated.id ? updated : c));
            setEditCard(null);
          }}
        />
      )}
    </AppLayout>
  );
}
