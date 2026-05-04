"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import AppLayout from "@/components/AppLayout";
import { createSupabaseBrowserClient } from "@/utils/supabase/client";
import { mockBusinessHours } from "@/lib/mock-data";
import { getDayRanges, dateToString } from "@/lib/availability";
import type { AvailabilityException, ExceptionType } from "@/lib/types";
import {
  fetchExceptions,
  createException,
  deleteException,
} from "./actions";
import {
  Building2,
  Scissors,
  CalendarClock,
  MessageSquare,
  CalendarDays,
  CheckCircle,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  ChevronLeft,
  ChevronRight,
  Ban,
  CalendarPlus,
  X,
} from "lucide-react";

type Tab = "perfil" | "servicos" | "horarios" | "disponibilidade" | "whatsapp";

const DAYS_FULL = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];
const DAYS_ABBR = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

const defaultHours = DAYS_FULL.map((day, i) => ({
  day,
  open: i !== 0 && i !== 6,
  start: "09:00",
  end: "19:00",
}));

const TABS: { key: Tab; label: string; icon: React.ElementType }[] = [
  { key: "perfil", label: "Perfil do Negócio", icon: Building2 },
  { key: "servicos", label: "Serviços", icon: Scissors },
  { key: "horarios", label: "Horários Base", icon: CalendarClock },
  { key: "disponibilidade", label: "Disponibilidade", icon: CalendarDays },
  { key: "whatsapp", label: "WhatsApp Business", icon: MessageSquare },
];

const CATEGORIES = [
  "Cabeleireira", "Unhas / Manicure", "Sobrancelhas", "Estética",
  "Spa", "Barbearia", "Nutricionista", "Fisioterapeuta",
  "Psicólogo", "Personal Trainer", "Fotógrafo", "Tatuador", "Outro",
];

/* ─── Disponibilidade Tab ─── */

function DisponibilidadeTab() {
  const today = new Date(2026, 3, 27);
  const [viewDate, setViewDate] = useState({ year: 2026, month: 3 });
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [exceptions, setExceptions] = useState<AvailabilityException[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<{ type: ExceptionType; start: string; end: string; reason: string }>({
    type: "block", start: "09:00", end: "13:00", reason: "",
  });

  // Carregar exceções do Supabase ao montar
  useEffect(() => {
    fetchExceptions()
      .then(setExceptions)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const firstDay = new Date(viewDate.year, viewDate.month, 1).getDay();
  const daysInMonth = new Date(viewDate.year, viewDate.month + 1, 0).getDate();

  const prevMonth = () =>
    setViewDate((d) => d.month === 0 ? { year: d.year - 1, month: 11 } : { year: d.year, month: d.month - 1 });
  const nextMonth = () =>
    setViewDate((d) => d.month === 11 ? { year: d.year + 1, month: 0 } : { year: d.year, month: d.month + 1 });

  const getDayStatus = (dateStr: string) => {
    const blocks = exceptions.filter((e) => e.date === dateStr && e.type === "block");
    const opens = exceptions.filter((e) => e.date === dateStr && e.type === "open");
    const ranges = getDayRanges(dateStr, mockBusinessHours, exceptions);
    return { hasBlock: blocks.length > 0, hasOpen: opens.length > 0, available: ranges.length > 0 };
  };

  const selectedDateExceptions = selectedDate ? exceptions.filter((e) => e.date === selectedDate) : [];
  const selectedDateRanges = selectedDate ? getDayRanges(selectedDate, mockBusinessHours, exceptions) : [];

  const selectedDayOfWeek = selectedDate
    ? new Date(selectedDate + "T12:00:00").getDay()
    : null;
  const baseHoursForSelected = selectedDayOfWeek !== null
    ? mockBusinessHours.find((h) => h.day_of_week === selectedDayOfWeek)
    : null;

  const addException = async () => {
    if (!selectedDate || !form.start || !form.end) return;
    setSaving(true);
    setError(null);
    try {
      const created = await createException({
        date: selectedDate,
        type: form.type,
        start_time: form.start,
        end_time: form.end,
        reason: form.reason || null,
      });
      setExceptions((prev) =>
        [...prev, created].sort((a, b) =>
          a.date !== b.date ? a.date.localeCompare(b.date) : a.start_time.localeCompare(b.start_time)
        )
      );
      setShowForm(false);
      setForm({ type: "block", start: "09:00", end: "13:00", reason: "" });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const removeException = async (id: string) => {
    const snapshot = exceptions;
    setExceptions((prev) => prev.filter((e) => e.id !== id)); // otimista
    try {
      await deleteException(id);
    } catch (e) {
      setExceptions(snapshot); // reverter se falhar
      setError((e as Error).message);
    }
  };

  const upcomingExceptions = exceptions
    .filter((e) => e.date >= dateToString(today.getFullYear(), today.getMonth(), today.getDate()))
    .sort((a, b) => a.date.localeCompare(b.date));

  if (loading) {
    return (
      <div className="rounded-xl border border-white/5 bg-[#1E293B] p-10 flex items-center justify-center gap-3 text-sm text-slate-500">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#00B4D8] border-t-transparent" />
        A carregar exceções…
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Error banner */}
      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-xs text-red-400 flex items-start justify-between gap-3">
          <span>
            <strong>Erro Supabase:</strong> {error}
            {error.includes("does not exist") && (
              <span className="block mt-1 text-red-500/70">
                Corre o ficheiro <code>supabase-schema.sql</code> no SQL Editor do Supabase.
              </span>
            )}
          </span>
          <button onClick={() => setError(null)} className="shrink-0 text-red-400/60 hover:text-red-400">×</button>
        </div>
      )}

      <div className="flex gap-4">
        {/* Calendar */}
        <div className="rounded-xl border border-white/5 bg-[#1E293B] p-4 w-72 shrink-0">
          <div className="flex items-center justify-between mb-4">
            <button onClick={prevMonth} className="text-slate-500 hover:text-white p-1">
              <ChevronLeft size={15} />
            </button>
            <p className="text-sm font-semibold text-white">
              {MONTH_NAMES[viewDate.month]} {viewDate.year}
            </p>
            <button onClick={nextMonth} className="text-slate-500 hover:text-white p-1">
              <ChevronRight size={15} />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-0.5 mb-1">
            {DAYS_ABBR.map((d) => (
              <p key={d} className="text-center text-[9px] font-semibold text-slate-600 py-1">{d}</p>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-0.5">
            {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateStr = dateToString(viewDate.year, viewDate.month, day);
              const { hasBlock, hasOpen, available } = getDayStatus(dateStr);
              const isToday =
                viewDate.year === today.getFullYear() &&
                viewDate.month === today.getMonth() &&
                day === today.getDate();
              const isSelected = selectedDate === dateStr;

              return (
                <button
                  key={day}
                  onClick={() => { setSelectedDate(dateStr); setShowForm(false); }}
                  className={`relative flex flex-col items-center justify-center aspect-square rounded-md text-[11px] transition-colors ${
                    isSelected
                      ? "bg-[#00B4D8] text-white font-semibold"
                      : isToday
                      ? "border border-[#00B4D8] text-[#00B4D8]"
                      : available
                      ? "text-slate-300 hover:bg-white/5"
                      : "text-slate-600 hover:bg-white/5"
                  }`}
                >
                  {day}
                  {(hasBlock || hasOpen) && !isSelected && (
                    <div className="absolute bottom-0.5 flex gap-0.5">
                      {hasBlock && <span className="h-1 w-1 rounded-full bg-red-400" />}
                      {hasOpen && <span className="h-1 w-1 rounded-full bg-[#2DD4BF]" />}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          <div className="mt-3 flex items-center gap-3 text-[10px] text-slate-600">
            <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-red-400" />Bloqueio</span>
            <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-[#2DD4BF]" />Abertura extra</span>
          </div>
        </div>

        {/* Day detail panel */}
        <div className="flex-1 min-w-0">
          {!selectedDate ? (
            <div className="rounded-xl border border-white/5 bg-[#1E293B] p-8 text-center text-sm text-slate-500 h-full flex items-center justify-center">
              Clica num dia para gerir a disponibilidade
            </div>
          ) : (
            <div className="rounded-xl border border-white/5 bg-[#1E293B] p-5 space-y-4">
              {/* Day header */}
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold text-white">
                    {DAYS_FULL[new Date(selectedDate + "T12:00:00").getDay()]},{" "}
                    {new Date(selectedDate + "T12:00:00").getDate()} de{" "}
                    {MONTH_NAMES[new Date(selectedDate + "T12:00:00").getMonth()]}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Horário base:{" "}
                    {baseHoursForSelected?.is_closed
                      ? "Fechado"
                      : `${baseHoursForSelected?.open_time} – ${baseHoursForSelected?.close_time}`}
                  </p>
                </div>
                <button
                  onClick={() => { setShowForm(true); }}
                  className="flex items-center gap-1.5 rounded-lg bg-[#00B4D8]/10 px-3 py-1.5 text-xs font-medium text-[#00B4D8] hover:bg-[#00B4D8]/20 transition-colors"
                >
                  <Plus size={13} />
                  Adicionar exceção
                </button>
              </div>

              {/* Computed availability */}
              <div>
                <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 mb-2">
                  Disponibilidade real
                </p>
                {selectedDateRanges.length === 0 ? (
                  <div className="flex items-center gap-2 rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-400">
                    <Ban size={13} />
                    Sem disponibilidade neste dia
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {selectedDateRanges.map((r, i) => (
                      <span key={i} className="rounded-full bg-[#2DD4BF]/10 px-3 py-1 text-xs font-medium text-[#2DD4BF]">
                        {r.start} – {r.end}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Exceptions for this day */}
              {selectedDateExceptions.length > 0 && (
                <div>
                  <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 mb-2">
                    Exceções neste dia
                  </p>
                  <div className="space-y-2">
                    {selectedDateExceptions.map((ex) => (
                      <div key={ex.id} className="flex items-center gap-3 rounded-lg bg-[#0F172A] px-3 py-2.5">
                        <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${
                          ex.type === "block" ? "bg-red-500/15" : "bg-[#2DD4BF]/15"
                        }`}>
                          {ex.type === "block"
                            ? <Ban size={12} className="text-red-400" />
                            : <CalendarPlus size={12} className="text-[#2DD4BF]" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-white">
                            {ex.type === "block" ? "Bloqueio" : "Abertura extra"}: {ex.start_time} – {ex.end_time}
                          </p>
                          {ex.reason && <p className="text-[10px] text-slate-600 truncate">{ex.reason}</p>}
                        </div>
                        <button onClick={() => removeException(ex.id)} className="text-slate-600 hover:text-red-400 transition-colors">
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Add exception form */}
              {showForm && (
                <div className="rounded-lg border border-white/10 bg-[#0F172A] p-4 space-y-3">
                  <p className="text-xs font-semibold text-white">Nova exceção</p>

                  {/* Type */}
                  <div className="flex rounded-lg border border-white/10 bg-[#1E293B] p-0.5">
                    {([["block", "Bloqueio", "red-400"], ["open", "Abertura extra", "[#2DD4BF]"]] as const).map(([val, label, color]) => (
                      <button
                        key={val}
                        onClick={() => setForm((f) => ({ ...f, type: val }))}
                        className={`flex-1 rounded-md py-2 text-xs font-medium transition-colors ${
                          form.type === val ? `bg-white/10 text-${color}` : "text-slate-500 hover:text-white"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>

                  {/* Times */}
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <label className="block text-[10px] text-slate-500 mb-1">Início</label>
                      <input
                        type="time"
                        value={form.start}
                        onChange={(e) => setForm((f) => ({ ...f, start: e.target.value }))}
                        className="w-full rounded border border-white/10 bg-[#1E293B] px-2 py-1.5 text-xs text-white outline-none"
                      />
                    </div>
                    <span className="text-slate-600 text-xs mt-4">até</span>
                    <div className="flex-1">
                      <label className="block text-[10px] text-slate-500 mb-1">Fim</label>
                      <input
                        type="time"
                        value={form.end}
                        onChange={(e) => setForm((f) => ({ ...f, end: e.target.value }))}
                        className="w-full rounded border border-white/10 bg-[#1E293B] px-2 py-1.5 text-xs text-white outline-none"
                      />
                    </div>
                  </div>

                  {/* Reason */}
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-1">Motivo (opcional)</label>
                    <input
                      value={form.reason}
                      onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
                      placeholder="Ex: Formação, feriado, consulta…"
                      className="w-full rounded border border-white/10 bg-[#1E293B] px-2 py-1.5 text-xs text-white placeholder-slate-700 outline-none"
                    />
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={addException}
                      disabled={saving}
                      className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#00B4D8] py-2 text-xs font-semibold text-white hover:bg-[#0090b0] transition-colors disabled:opacity-60"
                    >
                      {saving && <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />}
                      {saving ? "A guardar…" : "Guardar exceção"}
                    </button>
                    <button
                      onClick={() => setShowForm(false)}
                      className="rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-400 hover:text-white transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Upcoming exceptions list */}
      {upcomingExceptions.length > 0 && (
        <div className="rounded-xl border border-white/5 bg-[#1E293B] p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
            Próximas exceções
          </p>
          <div className="space-y-2">
            {upcomingExceptions.map((ex) => {
              const d = new Date(ex.date + "T12:00:00");
              return (
                <div key={ex.id} className="flex items-center gap-3 rounded-lg bg-[#0F172A] px-4 py-3">
                  <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                    ex.type === "block" ? "bg-red-500/10" : "bg-[#2DD4BF]/10"
                  }`}>
                    {ex.type === "block"
                      ? <Ban size={13} className="text-red-400" />
                      : <CalendarPlus size={13} className="text-[#2DD4BF]" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-white">
                      {d.getDate()} de {MONTH_NAMES[d.getMonth()]} · {ex.start_time}–{ex.end_time}
                    </p>
                    <p className="text-[10px] text-slate-600">
                      {ex.type === "block" ? "Bloqueio" : "Abertura extra"}
                      {ex.reason ? ` · ${ex.reason}` : ""}
                    </p>
                  </div>
                  <button onClick={() => removeException(ex.id)} className="text-slate-600 hover:text-red-400 transition-colors">
                    <Trash2 size={13} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Main page ─── */

export default function ConfiguracoesPage() {
  const [tab, setTab] = useState<Tab>("perfil");
  const [showToken, setShowToken] = useState(false);
  const [saved, setSaved] = useState(false);
  const [hours, setHours] = useState(defaultHours);

  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoError, setLogoError] = useState<string | null>(null);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [businessInitials, setBusinessInitials] = useState("N");
  const logoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/business")
      .then((r) => r.json())
      .then((data) => {
        if (data.logo_url) setLogoUrl(data.logo_url);
        if (data.id) setBusinessId(data.id);
        if (data.name) {
          setBusinessInitials(
            data.name.split(" ").slice(0, 2).map((w: string) => w[0]).join("").toUpperCase()
          );
        }
      })
      .catch(() => {});
  }, []);

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !businessId) return;
    setLogoUploading(true);
    setLogoError(null);
    try {
      const ext = file.name.split(".").pop();
      const path = `${businessId}/logo.${ext}`;
      const supabase = createSupabaseBrowserClient();
      const { error: uploadError } = await supabase.storage
        .from("business-logos")
        .upload(path, file, { upsert: true, contentType: file.type });
      if (uploadError) throw new Error(uploadError.message);
      const { data: { publicUrl } } = supabase.storage.from("business-logos").getPublicUrl(path);
      const urlWithBust = `${publicUrl}?t=${Date.now()}`;
      await fetch("/api/business", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logo_url: urlWithBust }),
      });
      setLogoUrl(urlWithBust);
    } catch (err) {
      setLogoError((err as Error).message);
    } finally {
      setLogoUploading(false);
    }
  }

  const [services, setServices] = useState([
    { id: "s1", name: "Corte de cabelo", duration: 45, price: 20, active: true },
    { id: "s2", name: "Coloração", duration: 120, price: 60, active: true },
    { id: "s3", name: "Tratamento capilar", duration: 60, price: 35, active: true },
    { id: "s4", name: "Escova e brushing", duration: 40, price: 25, active: true },
  ]);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const toggleDay = (i: number) =>
    setHours((prev) => prev.map((h, idx) => idx === i ? { ...h, open: !h.open } : h));

  const updateHour = (i: number, field: "start" | "end", val: string) =>
    setHours((prev) => prev.map((h, idx) => idx === i ? { ...h, [field]: val } : h));

  const removeService = (id: string) => setServices((prev) => prev.filter((s) => s.id !== id));

  const toggleService = (id: string) =>
    setServices((prev) => prev.map((s) => s.id === id ? { ...s, active: !s.active } : s));

  return (
    <AppLayout>
      <div className="p-6 space-y-5">
        <div>
          <h1 className="text-xl font-semibold text-white">Configurações</h1>
          <p className="text-sm text-slate-400 mt-0.5">Gerir o perfil e preferências do negócio</p>
        </div>

        <div className="flex gap-6">
          {/* Sidebar tabs */}
          <div className="w-48 shrink-0 space-y-0.5">
            {TABS.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm transition-colors text-left ${
                  tab === key
                    ? "bg-[#00B4D8]/15 text-[#00B4D8] font-medium"
                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                <Icon size={16} />
                {label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Perfil */}
            {tab === "perfil" && (
              <div className="rounded-xl border border-white/5 bg-[#1E293B] p-6 space-y-5">
                <h2 className="text-sm font-semibold text-white">Perfil do Negócio</h2>

                {/* Logo upload */}
                <div className="flex items-center gap-5 pb-4 border-b border-white/5">
                  {logoUrl ? (
                    <Image
                      src={logoUrl}
                      alt="Logo"
                      width={64}
                      height={64}
                      className="h-16 w-16 rounded-xl object-cover border border-white/10"
                    />
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-[#00B4D8]/20 text-lg font-bold text-[#00B4D8]">
                      {businessInitials}
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-white mb-1">Logo do negócio</p>
                    <p className="text-xs text-slate-500 mb-3">Aparece no painel lateral. PNG, JPG ou WebP, máx. 2 MB.</p>
                    <input
                      ref={logoInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      className="hidden"
                      onChange={handleLogoUpload}
                    />
                    <button
                      onClick={() => logoInputRef.current?.click()}
                      disabled={logoUploading}
                      className="flex items-center gap-2 rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white hover:border-white/20 transition-colors disabled:opacity-60"
                    >
                      {logoUploading && <span className="h-3 w-3 animate-spin rounded-full border-2 border-[#00B4D8] border-t-transparent" />}
                      {logoUploading ? "A carregar…" : "Alterar logo"}
                    </button>
                    {logoError && <p className="text-[10px] text-red-400 mt-1.5">{logoError}</p>}
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Nome do negócio" defaultValue="Cabeleireira Lisboa" />
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-slate-400 mb-1.5">Categoria</label>
                    <select className="w-full rounded-lg border border-white/10 bg-[#0F172A] px-3 py-2.5 text-sm text-white outline-none focus:border-[#00B4D8]/50">
                      {CATEGORIES.map((c) => (<option key={c}>{c}</option>))}
                    </select>
                  </div>
                  <Field label="Telefone" defaultValue="+351 21 000 0000" />
                  <Field label="Email" defaultValue="info@cabeleireira-lisboa.pt" />
                  <div className="sm:col-span-2">
                    <Field label="Morada" defaultValue="Rua Augusta 123, Lisboa" />
                  </div>
                </div>
                <SaveButton onSave={handleSave} saved={saved} />
              </div>
            )}

            {/* Serviços */}
            {tab === "servicos" && (
              <div className="rounded-xl border border-white/5 bg-[#1E293B] p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-white">Serviços</h2>
                  <button className="flex items-center gap-1.5 rounded-lg bg-[#00B4D8]/10 px-3 py-1.5 text-xs font-medium text-[#00B4D8] hover:bg-[#00B4D8]/20 transition-colors">
                    <Plus size={13} />Adicionar serviço
                  </button>
                </div>
                <div className="space-y-2">
                  {services.map((s) => (
                    <div key={s.id} className="flex items-center gap-3 rounded-lg bg-[#0F172A] px-4 py-3">
                      <div className="flex-1 min-w-0 grid grid-cols-3 gap-3">
                        <p className="text-sm font-medium text-white truncate col-span-3 sm:col-span-1">{s.name}</p>
                        <p className="text-xs text-slate-500">{s.duration} min</p>
                        <p className="text-xs font-semibold text-[#2DD4BF]">€{s.price}</p>
                      </div>
                      <button
                        onClick={() => toggleService(s.id)}
                        className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-medium transition-colors ${
                          s.active ? "bg-[#2DD4BF]/15 text-[#2DD4BF]" : "bg-white/5 text-slate-500"
                        }`}
                      >
                        {s.active ? "Ativo" : "Inativo"}
                      </button>
                      <button onClick={() => removeService(s.id)} className="shrink-0 text-slate-600 hover:text-red-400 transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Horários */}
            {tab === "horarios" && (
              <div className="rounded-xl border border-white/5 bg-[#1E293B] p-6 space-y-4">
                <div>
                  <h2 className="text-sm font-semibold text-white">Horários Base de Funcionamento</h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Define os teus horários habituais. Para exceções pontuais, usa o separador Disponibilidade.
                  </p>
                </div>
                <div className="space-y-2">
                  {hours.map((h, i) => (
                    <div key={h.day} className="flex items-center gap-4 rounded-lg bg-[#0F172A] px-4 py-3">
                      <button
                        onClick={() => toggleDay(i)}
                        className={`relative flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${h.open ? "bg-[#00B4D8]" : "bg-white/10"}`}
                      >
                        <span className={`absolute h-3.5 w-3.5 rounded-full bg-white transition-transform ${h.open ? "translate-x-4" : "translate-x-1"}`} />
                      </button>
                      <p className="w-32 text-sm text-slate-300">{h.day}</p>
                      {h.open ? (
                        <div className="flex items-center gap-2">
                          <input type="time" value={h.start} onChange={(e) => updateHour(i, "start", e.target.value)} className="rounded border border-white/10 bg-[#1E293B] px-2 py-1 text-xs text-white outline-none" />
                          <span className="text-slate-600 text-xs">até</span>
                          <input type="time" value={h.end} onChange={(e) => updateHour(i, "end", e.target.value)} className="rounded border border-white/10 bg-[#1E293B] px-2 py-1 text-xs text-white outline-none" />
                        </div>
                      ) : (
                        <span className="text-xs text-slate-600">Fechado</span>
                      )}
                    </div>
                  ))}
                </div>
                <SaveButton onSave={handleSave} saved={saved} />
              </div>
            )}

            {/* Disponibilidade */}
            {tab === "disponibilidade" && <DisponibilidadeTab />}

            {/* WhatsApp */}
            {tab === "whatsapp" && (
              <div className="rounded-xl border border-white/5 bg-[#1E293B] p-6 space-y-5">
                <div>
                  <h2 className="text-sm font-semibold text-white">WhatsApp Business API</h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Liga o teu número WhatsApp Business para enviar confirmações, lembretes e notificações de lista de espera.
                  </p>
                </div>
                <div className="rounded-lg border border-[#00B4D8]/20 bg-[#00B4D8]/5 p-4 text-xs text-slate-400 space-y-1">
                  <p className="font-semibold text-[#00B4D8] mb-2">Como configurar:</p>
                  <ol className="list-decimal list-inside space-y-1">
                    <li>Acede ao Meta for Developers e cria uma aplicação Business.</li>
                    <li>Adiciona o produto "WhatsApp" à tua aplicação.</li>
                    <li>Em WhatsApp &gt; Configurações da API, copia o Phone Number ID.</li>
                    <li>Gera ou copia o Access Token permanente.</li>
                    <li>Cola abaixo e guarda.</li>
                  </ol>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5">Phone Number ID</label>
                    <input placeholder="Ex: 123456789012345" className="w-full rounded-lg border border-white/10 bg-[#0F172A] px-3 py-2.5 text-sm text-white placeholder-slate-700 outline-none focus:border-[#00B4D8]/50 transition-colors font-mono" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5">Access Token</label>
                    <div className="relative">
                      <input type={showToken ? "text" : "password"} placeholder="EAAxxxxxxxxxxxxxx…" className="w-full rounded-lg border border-white/10 bg-[#0F172A] px-3 py-2.5 pr-10 text-sm text-white placeholder-slate-700 outline-none focus:border-[#00B4D8]/50 transition-colors font-mono" />
                      <button onClick={() => setShowToken(!showToken)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors">
                        {showToken ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>
                </div>
                <div className="pt-1 space-y-3">
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Automatizações ativas</h3>
                  {[
                    { label: "Confirmação de marcação", desc: "Envia mensagem ao cliente quando a marcação é confirmada" },
                    { label: "Lembrete 24h antes", desc: "Lembra o cliente no dia anterior à marcação" },
                    { label: "Notificação de vaga", desc: "Avisa clientes da lista de espera quando surge um cancelamento" },
                  ].map((a) => (
                    <div key={a.label} className="flex items-start justify-between gap-3 rounded-lg bg-[#0F172A] px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-white">{a.label}</p>
                        <p className="text-xs text-slate-600 mt-0.5">{a.desc}</p>
                      </div>
                      <div className="flex h-5 w-9 shrink-0 items-center rounded-full bg-[#00B4D8] cursor-pointer">
                        <span className="ml-auto mr-1 h-3.5 w-3.5 rounded-full bg-white" />
                      </div>
                    </div>
                  ))}
                </div>
                <SaveButton onSave={handleSave} saved={saved} />
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

function Field({ label, defaultValue, prefix }: { label: string; defaultValue: string; prefix?: string }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-400 mb-1.5">{label}</label>
      {prefix ? (
        <div className="flex rounded-lg border border-white/10 bg-[#0F172A] overflow-hidden focus-within:border-[#00B4D8]/50 transition-colors">
          <span className="flex items-center px-3 text-xs text-slate-600 bg-white/5 border-r border-white/10 whitespace-nowrap">{prefix}</span>
          <input defaultValue={defaultValue} className="flex-1 px-3 py-2.5 text-sm text-white bg-transparent outline-none" />
        </div>
      ) : (
        <input defaultValue={defaultValue} className="w-full rounded-lg border border-white/10 bg-[#0F172A] px-3 py-2.5 text-sm text-white outline-none focus:border-[#00B4D8]/50 transition-colors" />
      )}
    </div>
  );
}

function SaveButton({ onSave, saved }: { onSave: () => void; saved: boolean }) {
  return (
    <div className="flex justify-end pt-2">
      <button
        onClick={onSave}
        className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
          saved ? "bg-[#2DD4BF]/20 text-[#2DD4BF]" : "bg-[#00B4D8] text-white hover:bg-[#0090b0]"
        }`}
      >
        {saved && <CheckCircle size={15} />}
        {saved ? "Guardado!" : "Guardar alterações"}
      </button>
    </div>
  );
}
