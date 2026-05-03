"use client";

import { useState, useEffect } from "react";
import AppLayout from "@/components/AppLayout";
import type { WaitingListEntry } from "@/lib/types";
import { Clock, Bell, BellOff, Trash2, Plus, CheckCheck, Loader2 } from "lucide-react";

function WaitingCard({ entry, onNotify, onRemove }: {
  entry: WaitingListEntry;
  onNotify: (id: string) => void;
  onRemove: (id: string) => void;
}) {
  const client = entry.client as unknown as { name: string } | undefined;
  const service = entry.service as unknown as { name: string } | undefined;

  return (
    <div className="rounded-xl border border-white/5 bg-[#1E293B] p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#00B4D8]/20 text-sm font-semibold text-[#00B4D8]">
            {(client?.name ?? "?").charAt(0)}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white truncate">{client?.name ?? "—"}</p>
            <p className="text-xs text-slate-500 truncate">{service?.name ?? "—"}</p>
          </div>
        </div>
        <span
          className={`shrink-0 flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-medium ${
            entry.notified
              ? "bg-[#2DD4BF]/15 text-[#2DD4BF]"
              : "bg-yellow-500/15 text-yellow-400"
          }`}
        >
          {entry.notified ? <CheckCheck size={11} /> : <Clock size={11} />}
          {entry.notified ? "Notificado" : "A aguardar"}
        </span>
      </div>

      <div className="mt-3 space-y-1.5 text-xs text-slate-500">
        {entry.preferred_date && (
          <p>
            <span className="text-slate-600">Data preferida:</span>{" "}
            <span className="text-slate-300">
              {new Date(entry.preferred_date).toLocaleDateString("pt-PT")}
            </span>
          </p>
        )}
        {entry.preferred_time_start && (
          <p>
            <span className="text-slate-600">Horário:</span>{" "}
            <span className="text-slate-300">
              {entry.preferred_time_start}
              {entry.preferred_time_end ? ` – ${entry.preferred_time_end}` : ""}
            </span>
          </p>
        )}
        {entry.notes && (
          <p className="italic text-slate-600">{entry.notes}</p>
        )}
        <p>
          <span className="text-slate-600">Na lista desde:</span>{" "}
          {new Date(entry.created_at).toLocaleDateString("pt-PT")}
        </p>
      </div>

      <div className="mt-4 flex gap-2">
        {!entry.notified && (
          <button
            onClick={() => onNotify(entry.id)}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#00B4D8]/10 px-3 py-2 text-xs font-medium text-[#00B4D8] hover:bg-[#00B4D8]/20 transition-colors"
          >
            <Bell size={13} />
            Notificar via WhatsApp
          </button>
        )}
        {entry.notified && (
          <button className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#2DD4BF]/10 px-3 py-2 text-xs font-medium text-[#2DD4BF] cursor-default">
            <BellOff size={13} />
            Notificação enviada
          </button>
        )}
        <button
          onClick={() => onRemove(entry.id)}
          className="flex items-center justify-center rounded-lg bg-red-500/10 px-3 py-2 text-red-400 hover:bg-red-500/20 transition-colors"
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
}

export default function ListaEsperaPage() {
  const [list, setList] = useState<WaitingListEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/waiting-list")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setList(data);
        else setError(data.error ?? "Erro ao carregar lista de espera.");
      })
      .catch(() => setError("Erro ao carregar lista de espera."))
      .finally(() => setLoading(false));
  }, []);

  const handleNotify = (id: string) => {
    setList((prev) =>
      prev.map((e) => (e.id === id ? { ...e, notified: true } : e))
    );
  };

  const handleRemove = (id: string) => {
    setList((prev) => prev.filter((e) => e.id !== id));
  };

  const waiting = list.filter((e) => !e.notified);
  const notified = list.filter((e) => e.notified);

  return (
    <AppLayout>
      <div className="p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-white">Lista de Espera</h1>
            <p className="text-sm text-slate-400 mt-0.5">
              {loading
                ? "A carregar…"
                : `${waiting.length} cliente${waiting.length !== 1 ? "s" : ""} à espera de vaga`}
            </p>
          </div>
          <button className="flex items-center gap-2 rounded-lg bg-[#00B4D8] px-4 py-2 text-sm font-medium text-white hover:bg-[#0090b0] transition-colors">
            <Plus size={15} />
            Adicionar à lista
          </button>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={24} className="animate-spin text-slate-600" />
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-xs text-red-400">
            {error}
          </div>
        )}

        {!loading && !error && (
          <>
            {/* Info banner */}
            {waiting.length > 0 && (
              <div className="rounded-lg border border-[#00B4D8]/20 bg-[#00B4D8]/5 px-4 py-3 text-xs text-[#00B4D8]">
                <strong>{waiting.length}</strong> cliente{waiting.length !== 1 ? "s" : ""} aguarda{waiting.length === 1 ? "" : "m"} vaga.
                Quando surgir um cancelamento, notifica automaticamente via WhatsApp.
              </div>
            )}

            {/* Waiting */}
            {waiting.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
                  A aguardar ({waiting.length})
                </p>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {waiting.map((entry) => (
                    <WaitingCard
                      key={entry.id}
                      entry={entry}
                      onNotify={handleNotify}
                      onRemove={handleRemove}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Notified */}
            {notified.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
                  Notificados ({notified.length})
                </p>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {notified.map((entry) => (
                    <WaitingCard
                      key={entry.id}
                      entry={entry}
                      onNotify={handleNotify}
                      onRemove={handleRemove}
                    />
                  ))}
                </div>
              </div>
            )}

            {list.length === 0 && (
              <div className="rounded-xl border border-white/5 bg-[#1E293B] py-16 text-center">
                <Clock size={32} className="mx-auto text-slate-700 mb-3" />
                <p className="text-sm text-slate-500">Lista de espera vazia.</p>
                <p className="text-xs text-slate-600 mt-1">
                  Adiciona clientes para notificá-los automaticamente quando surgir uma vaga.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
}
