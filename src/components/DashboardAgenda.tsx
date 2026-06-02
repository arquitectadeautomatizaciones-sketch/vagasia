"use client";

import { useState } from "react";
import { CheckCircle, Clock, XCircle } from "lucide-react";
import type { Professional } from "@/lib/types";

// ── Types ──────────────────────────────────────────────────────────────────

interface Appt {
  id: string;
  starts_at: string;
  ends_at: string;
  status: string;
  price: number;
  professional_id?: string | null;
  client:  { name: string } | null;
  service: { name: string } | null;
}

interface Props {
  appointments:  Appt[];
  professionals: Pick<Professional, "id" | "name" | "role">[];
  myProfId:      string | null;   // null for owners before migration
  role:          "owner" | "collaborator";
}

// ── Helpers ────────────────────────────────────────────────────────────────

function formatTime(d: string) {
  return new Date(d).toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" });
}

const STATUS_STYLE: Record<string, { bg: string; text: string; icon: React.ElementType }> = {
  confirmada: { bg: "bg-[#2DD4BF]/15", text: "text-[#2DD4BF]",   icon: CheckCircle },
  pendente:   { bg: "bg-yellow-500/15", text: "text-yellow-400", icon: Clock },
  cancelada:  { bg: "bg-red-500/15",   text: "text-red-400",     icon: XCircle },
};

// ── Component ──────────────────────────────────────────────────────────────

export default function DashboardAgenda({ appointments, professionals, myProfId, role }: Props) {
  // "all" | professionalId
  const [filter, setFilter] = useState<string>("all");

  // Owners with 2 professionals see the selector; collaborators never do
  const showSelector = role === "owner" && professionals.length >= 2;

  // Apply filter
  const visible = (() => {
    if (role === "collaborator") {
      // Collaborator always sees only their own appointments
      return myProfId
        ? appointments.filter((a) => a.professional_id === myProfId)
        : appointments;
    }
    if (filter === "all") return appointments;
    return appointments.filter((a) => a.professional_id === filter);
  })();

  return (
    <div className="rounded-xl border border-white/5 bg-[#1E293B]">
      {/* Header con selector */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-white/5">
        <h2 className="text-sm font-semibold text-white">Agenda de Hoje</h2>

        <div className="flex items-center gap-3">
          {showSelector && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 hidden sm:inline">Ver agenda de:</span>
              <div className="flex rounded-lg border border-white/10 overflow-hidden text-xs">
                <button
                  onClick={() => setFilter("all")}
                  className={`px-3 py-1.5 transition-colors ${
                    filter === "all"
                      ? "bg-[#00B4D8] text-white font-medium"
                      : "text-slate-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  Todas
                </button>
                {professionals.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setFilter(p.id)}
                    className={`px-3 py-1.5 border-l border-white/10 transition-colors ${
                      filter === p.id
                        ? "bg-[#00B4D8] text-white font-medium"
                        : "text-slate-400 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    {p.name.split(" ")[0]}
                  </button>
                ))}
              </div>
            </div>
          )}

          <a href="/marcacoes" className="text-xs text-[#00B4D8] hover:underline">
            Ver tudo
          </a>
        </div>
      </div>

      {/* Lista de citas */}
      {visible.length === 0 ? (
        <p className="px-5 py-8 text-center text-sm text-slate-500">
          Sem marcações para hoje.
        </p>
      ) : (
        <div className="divide-y divide-white/5">
          {visible.map((appt) => {
            const s = STATUS_STYLE[appt.status] ?? STATUS_STYLE.pendente;
            const Icon = s.icon;
            // Show professional name badge when viewing "all" and there are 2+ professionals
            const profName = showSelector && filter === "all"
              ? professionals.find((p) => p.id === appt.professional_id)?.name?.split(" ")[0]
              : null;

            return (
              <div key={appt.id} className="flex items-center gap-4 px-5 py-3.5">
                <div className="w-16 text-center shrink-0">
                  <p className="text-xs font-medium text-slate-300">{formatTime(appt.starts_at)}</p>
                  <p className="text-[10px] text-slate-600">{formatTime(appt.ends_at)}</p>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {appt.client?.name ?? "—"}
                    </p>
                    {profName && (
                      <span className="shrink-0 rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-slate-400">
                        {profName}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 truncate">{appt.service?.name ?? "—"}</p>
                </div>
                <p className="text-sm font-semibold text-slate-300 shrink-0">
                  €{(appt.price ?? 0).toFixed(2)}
                </p>
                <span className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium shrink-0 ${s.bg} ${s.text}`}>
                  <Icon size={12} />
                  {appt.status.charAt(0).toUpperCase() + appt.status.slice(1)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
