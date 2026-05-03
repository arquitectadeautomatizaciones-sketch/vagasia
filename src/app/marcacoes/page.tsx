"use client";

import { useState, useEffect } from "react";
import AppLayout from "@/components/AppLayout";
import type { Appointment, AppointmentStatus } from "@/lib/types";
import { CheckCircle, Clock, XCircle, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

type ViewMode = "dia" | "semana" | "mês";

const STATUS_CONFIG: Record<AppointmentStatus, { label: string; bg: string; text: string; icon: React.ElementType }> = {
  confirmada: { label: "Confirmada", bg: "bg-[#2DD4BF]/15", text: "text-[#2DD4BF]", icon: CheckCircle },
  pendente: { label: "Pendente", bg: "bg-yellow-500/15", text: "text-yellow-400", icon: Clock },
  cancelada: { label: "Cancelada", bg: "bg-red-500/15", text: "text-red-400", icon: XCircle },
};

const FILTERS: { key: AppointmentStatus | "todas"; label: string }[] = [
  { key: "todas", label: "Todas" },
  { key: "confirmada", label: "Confirmadas" },
  { key: "pendente", label: "Pendentes" },
  { key: "cancelada", label: "Canceladas" },
];

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" });
}

function formatDateLabel(date: Date) {
  return date.toLocaleDateString("pt-PT", { day: "numeric", month: "long", year: "numeric" });
}

function isSameDay(dateStr: string, ref: Date) {
  const d = new Date(dateStr);
  return (
    d.getFullYear() === ref.getFullYear() &&
    d.getMonth() === ref.getMonth() &&
    d.getDate() === ref.getDate()
  );
}

export default function MarcacoesPage() {
  const [view, setView] = useState<ViewMode>("dia");
  const [filter, setFilter] = useState<AppointmentStatus | "todas">("todas");
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    fetch("/api/appointments")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setAppointments(data);
        else setError(data.error ?? "Erro ao carregar marcações.");
      })
      .catch(() => setError("Erro ao carregar marcações."))
      .finally(() => setLoading(false));
  }, []);

  const visibleByDate = view === "dia"
    ? appointments.filter((a) => isSameDay(a.starts_at, currentDate))
    : appointments;

  const filtered = filter === "todas"
    ? visibleByDate
    : visibleByDate.filter((a) => a.status === filter);

  const prevDate = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() - 1);
    setCurrentDate(d);
  };
  const nextDate = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + 1);
    setCurrentDate(d);
  };

  return (
    <AppLayout>
      <div className="p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-white">Marcações</h1>
            <p className="text-sm text-slate-400 mt-0.5">Gerir todos os agendamentos</p>
          </div>
        </div>

        {/* Controls bar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Date navigator */}
          <div className="flex items-center gap-2">
            <button
              onClick={prevDate}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-white/5 hover:text-white transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm font-medium text-white min-w-[180px] text-center">
              {formatDateLabel(currentDate)}
            </span>
            <button
              onClick={nextDate}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-white/5 hover:text-white transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="flex items-center gap-3">
            {/* View toggle */}
            <div className="flex rounded-lg border border-white/10 bg-[#1E293B] p-0.5">
              {(["dia", "semana", "mês"] as ViewMode[]).map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                    view === v
                      ? "bg-[#00B4D8] text-white"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>

            {/* Status filter */}
            <div className="flex rounded-lg border border-white/10 bg-[#1E293B] p-0.5">
              {FILTERS.map((f) => (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                    filter === f.key
                      ? "bg-white/10 text-white"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Appointments list */}
        <div className="rounded-xl border border-white/5 bg-[#1E293B] overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={24} className="animate-spin text-slate-600" />
            </div>
          ) : error ? (
            <div className="py-16 text-center text-sm text-red-400">{error}</div>
          ) : (
            <div className="divide-y divide-white/5">
              {filtered.length === 0 ? (
                <div className="py-16 text-center text-sm text-slate-500">
                  Nenhuma marcação encontrada.
                </div>
              ) : (
                filtered.map((appt) => {
                  const cfg = STATUS_CONFIG[appt.status];
                  const Icon = cfg.icon;
                  const client = appt.client as unknown as { name: string } | undefined;
                  const service = appt.service as unknown as { name: string; duration_minutes: number } | undefined;
                  return (
                    <div
                      key={appt.id}
                      className="flex items-center gap-4 px-5 py-4 hover:bg-white/2 transition-colors cursor-pointer"
                    >
                      {/* Time */}
                      <div className="w-14 shrink-0 text-center">
                        <p className="text-xs font-semibold text-white">
                          {formatTime(appt.starts_at)}
                        </p>
                        <div className="my-1 mx-auto h-6 w-px bg-white/10" />
                        <p className="text-[10px] text-slate-600">
                          {formatTime(appt.ends_at)}
                        </p>
                      </div>

                      {/* Color bar */}
                      <div className="w-1 self-stretch rounded-full bg-[#00B4D8]/40" />

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white">{client?.name ?? "—"}</p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {service?.name ?? "—"}
                          {service?.duration_minutes ? ` · ${service.duration_minutes} min` : ""}
                        </p>
                        {appt.notes && (
                          <p className="text-xs text-slate-600 mt-0.5 italic">{appt.notes}</p>
                        )}
                      </div>

                      {/* Price */}
                      <p className="text-sm font-semibold text-[#2DD4BF]">€{appt.price}</p>

                      {/* Status badge */}
                      <span
                        className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-medium ${cfg.bg} ${cfg.text}`}
                      >
                        <Icon size={12} />
                        {cfg.label}
                      </span>

                      {/* Actions */}
                      <div className="flex items-center gap-1 ml-1">
                        {appt.status === "pendente" && (
                          <>
                            <button className="rounded-lg px-2.5 py-1.5 text-[11px] font-medium bg-[#2DD4BF]/10 text-[#2DD4BF] hover:bg-[#2DD4BF]/20 transition-colors">
                              Confirmar
                            </button>
                            <button className="rounded-lg px-2.5 py-1.5 text-[11px] font-medium bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors">
                              Cancelar
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Summary */}
        {!loading && !error && (
          <div className="flex gap-4 text-xs text-slate-500">
            {FILTERS.filter((f) => f.key !== "todas").map((f) => {
              const count = appointments.filter((a) => a.status === f.key).length;
              return (
                <span key={f.key}>
                  {count} {f.label.toLowerCase()}
                </span>
              );
            })}
            <span className="ml-auto text-slate-400">
              Total: €{filtered.reduce((s, a) => s + a.price, 0).toFixed(2)}
            </span>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
