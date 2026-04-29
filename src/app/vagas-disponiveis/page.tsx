"use client";

import { useState, useEffect } from "react";
import AppLayout from "@/components/AppLayout";
import type { AvailableSlot, Service, SlotStatus } from "@/lib/types";
import {
  CalendarCheck,
  Plus,
  X,
  Clock,
  CheckCircle2,
  XCircle,
  Ban,
  Loader2,
} from "lucide-react";

const statusConfig: Record<
  SlotStatus,
  { label: string; badge: string; section: string; icon: React.ElementType }
> = {
  disponivel: {
    label: "Disponível",
    badge: "bg-[#2DD4BF]/15 text-[#2DD4BF]",
    section: "text-[#2DD4BF]",
    icon: CheckCircle2,
  },
  reservada: {
    label: "Reservada",
    badge: "bg-yellow-500/15 text-yellow-400",
    section: "text-yellow-400",
    icon: Clock,
  },
  cancelada: {
    label: "Cancelada",
    badge: "bg-red-500/15 text-red-400",
    section: "text-red-400",
    icon: XCircle,
  },
};

function formatDate(dateStr: string) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("pt-PT", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function SlotCard({
  slot,
  onDespublicar,
}: {
  slot: AvailableSlot;
  onDespublicar: (id: string) => void;
}) {
  const cfg = statusConfig[slot.status];
  const StatusIcon = cfg.icon;

  return (
    <div className="rounded-xl border border-white/5 bg-[#1E293B] p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-white capitalize">
            {formatDate(slot.date)}
          </p>
          <p className="text-xs text-slate-400 mt-0.5">
            {slot.start_time} – {slot.end_time}
          </p>
        </div>
        <span
          className={`shrink-0 flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-medium ${cfg.badge}`}
        >
          <StatusIcon size={11} />
          {cfg.label}
        </span>
      </div>

      {slot.service && (
        <p className="mt-2.5 text-xs text-slate-500">
          <span className="text-slate-600">Serviço:</span>{" "}
          <span className="text-slate-300">{slot.service.name}</span>
        </p>
      )}

      {slot.notes && (
        <p className="mt-1.5 text-xs italic text-slate-600">{slot.notes}</p>
      )}

      {slot.status === "disponivel" && (
        <div className="mt-4">
          <button
            onClick={() => onDespublicar(slot.id)}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-red-500/10 px-3 py-2 text-xs font-medium text-red-400 hover:bg-red-500/20 transition-colors"
          >
            <Ban size={13} />
            Despublicar vaga
          </button>
        </div>
      )}
    </div>
  );
}

interface FormState {
  date: string;
  start_time: string;
  end_time: string;
  service_id: string;
  notes: string;
}

const emptyForm: FormState = {
  date: "",
  start_time: "",
  end_time: "",
  service_id: "",
  notes: "",
};

export default function VagasDisponiveisPage() {
  const [slots, setSlots] = useState<AvailableSlot[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    setError(null);
    try {
      const [slotsRes, servicesRes] = await Promise.all([
        fetch("/api/available-slots"),
        fetch("/api/services"),
      ]);
      if (!slotsRes.ok) {
        const json = await slotsRes.json().catch(() => ({}));
        throw new Error(json.error ?? "Erro ao carregar vagas.");
      }
      const slotsData = await slotsRes.json();
      setSlots(slotsData);

      if (servicesRes.ok) {
        const servicesData = await servicesRes.json();
        setServices(servicesData);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro desconhecido.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.start_time >= form.end_time) {
      setFormError("A hora de fim tem de ser posterior à hora de início.");
      return;
    }
    setSubmitting(true);
    setFormError(null);
    try {
      const res = await fetch("/api/available-slots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || "Erro ao publicar vaga.");
      }
      const newSlot: AvailableSlot = await res.json();
      setSlots((prev) =>
        [...prev, newSlot].sort((a, b) =>
          a.date === b.date
            ? a.start_time.localeCompare(b.start_time)
            : a.date.localeCompare(b.date)
        )
      );
      setForm(emptyForm);
      setShowForm(false);
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Erro ao publicar vaga.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDespublicar(id: string) {
    setSlots((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: "cancelada" as SlotStatus } : s))
    );
    try {
      const res = await fetch(`/api/available-slots/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "cancelada" }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setSlots((prev) =>
        prev.map((s) => (s.id === id ? { ...s, status: "disponivel" as SlotStatus } : s))
      );
    }
  }

  const disponíveis = slots.filter((s) => s.status === "disponivel");
  const reservadas = slots.filter((s) => s.status === "reservada");
  const canceladas = slots.filter((s) => s.status === "cancelada");

  return (
    <AppLayout>
      <div className="p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-white">Vagas Disponíveis</h1>
            <p className="text-sm text-slate-400 mt-0.5">
              Publica vagas para o Assistente oferecer aos clientes via WhatsApp
            </p>
          </div>
          <button
            onClick={() => { setShowForm(true); setFormError(null); }}
            className="flex items-center gap-2 rounded-lg bg-[#00B4D8] px-4 py-2 text-sm font-medium text-white hover:bg-[#0090b0] transition-colors"
          >
            <Plus size={15} />
            Nova Vaga
          </button>
        </div>

        {/* Contadores */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-white/5 bg-[#1E293B] p-4 text-center">
            <p className="text-2xl font-bold text-[#2DD4BF]">{disponíveis.length}</p>
            <p className="text-xs text-slate-500 mt-0.5">Disponíveis</p>
          </div>
          <div className="rounded-xl border border-white/5 bg-[#1E293B] p-4 text-center">
            <p className="text-2xl font-bold text-yellow-400">{reservadas.length}</p>
            <p className="text-xs text-slate-500 mt-0.5">Reservadas</p>
          </div>
          <div className="rounded-xl border border-white/5 bg-[#1E293B] p-4 text-center">
            <p className="text-2xl font-bold text-red-400">{canceladas.length}</p>
            <p className="text-xs text-slate-500 mt-0.5">Canceladas</p>
          </div>
        </div>

        {/* Error state */}
        {error && (
          <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-xs text-red-400">
            {error}
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={24} className="animate-spin text-slate-600" />
          </div>
        )}

        {/* Conteúdo */}
        {!loading && !error && (
          <>
            {slots.length === 0 && (
              <div className="rounded-xl border border-white/5 bg-[#1E293B] py-16 text-center">
                <CalendarCheck size={32} className="mx-auto text-slate-700 mb-3" />
                <p className="text-sm text-slate-500">Nenhuma vaga publicada.</p>
                <p className="text-xs text-slate-600 mt-1">
                  Publica vagas para o Assistente as oferecer automaticamente via WhatsApp.
                </p>
              </div>
            )}

            {/* Disponíveis */}
            {disponíveis.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[#2DD4BF] mb-3">
                  Disponíveis ({disponíveis.length})
                </p>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {disponíveis.map((slot) => (
                    <SlotCard
                      key={slot.id}
                      slot={slot}
                      onDespublicar={handleDespublicar}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Reservadas */}
            {reservadas.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-yellow-400 mb-3">
                  Reservadas ({reservadas.length})
                </p>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {reservadas.map((slot) => (
                    <SlotCard
                      key={slot.id}
                      slot={slot}
                      onDespublicar={handleDespublicar}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Canceladas */}
            {canceladas.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-red-400 mb-3">
                  Canceladas ({canceladas.length})
                </p>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {canceladas.map((slot) => (
                    <SlotCard
                      key={slot.id}
                      slot={slot}
                      onDespublicar={handleDespublicar}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal: Nova Vaga */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 px-4 pt-12 pb-12">
          <div className="w-full max-w-md rounded-2xl border border-white/5 bg-[#1E293B] p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-base font-semibold text-white">Nova Vaga Disponível</h2>
              <button
                onClick={() => setShowForm(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-white/5 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Data */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">
                  Data *
                </label>
                <input
                  type="date"
                  required
                  value={form.date}
                  onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                  className="w-full rounded-lg border border-white/10 bg-[#0F172A] px-3 py-2.5 text-sm text-white focus:border-[#00B4D8]/50 focus:outline-none"
                />
              </div>

              {/* Horário */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">
                    Hora início *
                  </label>
                  <input
                    type="time"
                    required
                    value={form.start_time}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, start_time: e.target.value }))
                    }
                    className="w-full rounded-lg border border-white/10 bg-[#0F172A] px-3 py-2.5 text-sm text-white focus:border-[#00B4D8]/50 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">
                    Hora fim *
                  </label>
                  <input
                    type="time"
                    required
                    value={form.end_time}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, end_time: e.target.value }))
                    }
                    className="w-full rounded-lg border border-white/10 bg-[#0F172A] px-3 py-2.5 text-sm text-white focus:border-[#00B4D8]/50 focus:outline-none"
                  />
                </div>
              </div>

              {/* Serviço */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">
                  Serviço (opcional)
                </label>
                <select
                  value={form.service_id}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, service_id: e.target.value }))
                  }
                  className="w-full rounded-lg border border-white/10 bg-[#0F172A] px-3 py-2.5 text-sm text-white focus:border-[#00B4D8]/50 focus:outline-none"
                >
                  <option value="">Qualquer serviço</option>
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Notas */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">
                  Notas (opcional)
                </label>
                <textarea
                  rows={3}
                  value={form.notes}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, notes: e.target.value }))
                  }
                  placeholder="Ex: disponível para marcação de última hora"
                  className="w-full resize-none rounded-lg border border-white/10 bg-[#0F172A] px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:border-[#00B4D8]/50 focus:outline-none"
                />
              </div>

              {formError && (
                <p className="rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-400">
                  {formError}
                </p>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 rounded-lg border border-white/10 px-4 py-2.5 text-sm text-slate-400 hover:bg-white/5 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#00B4D8] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#0090b0] transition-colors disabled:opacity-50"
                >
                  {submitting ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : (
                    <Plus size={15} />
                  )}
                  Publicar Vaga
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
