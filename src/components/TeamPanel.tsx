"use client";

import { useState, useCallback } from "react";
import { X, Plus, Trash2, ChevronLeft, Check, Loader2 } from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────

interface ServiceRow   { name: string; duration_minutes: number; price: number }
interface DayConfig    { day_of_week: number; label: string; is_closed: boolean; open_time: string; close_time: string }
interface ApptRow      { client_name: string; client_phone: string; service_index: number; date: string; time: string }

// ── Constants ──────────────────────────────────────────────────────────────

const DEFAULT_HOURS: DayConfig[] = [
  { day_of_week: 1, label: "Segunda-feira", is_closed: false, open_time: "09:00", close_time: "19:00" },
  { day_of_week: 2, label: "Terça-feira",   is_closed: false, open_time: "09:00", close_time: "19:00" },
  { day_of_week: 3, label: "Quarta-feira",  is_closed: false, open_time: "09:00", close_time: "19:00" },
  { day_of_week: 4, label: "Quinta-feira",  is_closed: false, open_time: "09:00", close_time: "19:00" },
  { day_of_week: 5, label: "Sexta-feira",   is_closed: false, open_time: "09:00", close_time: "19:00" },
  { day_of_week: 6, label: "Sábado",        is_closed: true,  open_time: "10:00", close_time: "13:00" },
  { day_of_week: 0, label: "Domingo",       is_closed: true,  open_time: "09:00", close_time: "13:00" },
];

function isoDate(offsetDays: number) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().split("T")[0];
}

// ── Styles ─────────────────────────────────────────────────────────────────

const inputCls =
  "w-full rounded-lg border border-white/10 bg-[#0F172A] px-3 py-2 text-sm text-white placeholder-slate-600 focus:border-[#00B4D8] focus:outline-none transition-colors";

const stepLabel = (n: number, current: number) =>
  `flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
    n < current  ? "bg-[#00B4D8] text-white"
    : n === current ? "bg-[#00B4D8] text-white ring-4 ring-[#00B4D8]/20"
    : "border border-white/10 text-slate-500"
  }`;

// ── Props ──────────────────────────────────────────────────────────────────

interface Props {
  onClose:   () => void;
  onSuccess: (name: string) => void;
}

// ── Component ──────────────────────────────────────────────────────────────

export default function TeamPanel({ onClose, onSuccess }: Props) {
  const [step,     setStep]     = useState<1 | 2 | 3 | 4>(1);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");

  // Step 1
  const [collabName,  setCollabName]  = useState("");
  const [collabEmail, setCollabEmail] = useState("");

  // Step 2 — services
  const [services, setServices] = useState<ServiceRow[]>([
    { name: "", duration_minutes: 45, price: 20 },
  ]);

  // Step 3 — hours
  const [hours, setHours] = useState<DayConfig[]>(DEFAULT_HOURS);

  // Step 4 — appointments
  const [apptRows, setApptRows] = useState<ApptRow[]>([]);

  // ── Helpers ───────────────────────────────────────────────────────────────

  const setSvc = useCallback(
    (i: number, patch: Partial<ServiceRow>) =>
      setServices((prev) => prev.map((s, idx) => (idx === i ? { ...s, ...patch } : s))),
    []
  );

  const setDay = useCallback(
    (i: number, patch: Partial<DayConfig>) =>
      setHours((prev) => prev.map((d, idx) => (idx === i ? { ...d, ...patch } : d))),
    []
  );

  const setAppt = useCallback(
    (i: number, patch: Partial<ApptRow>) =>
      setApptRows((prev) => prev.map((a, idx) => (idx === i ? { ...a, ...patch } : a))),
    []
  );

  // ── Validations per step ──────────────────────────────────────────────────

  function validateStep1() {
    if (!collabName.trim())  { setError("O nome é obrigatório."); return false; }
    if (!collabEmail.trim()) { setError("O email é obrigatório."); return false; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(collabEmail)) {
      setError("Email inválido."); return false;
    }
    return true;
  }

  function validateStep2() {
    if (!services.some((s) => s.name.trim())) {
      setError("Adiciona pelo menos um serviço."); return false;
    }
    return true;
  }

  // ── Submit ────────────────────────────────────────────────────────────────

  async function handleSubmit() {
    setError(""); setLoading(true);
    try {
      const validAppts = apptRows.filter(
        (a) => a.client_name.trim() && a.client_phone.trim() && a.date && a.time
      );
      const res = await fetch("/api/team/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name:         collabName.trim(),
          email:        collabEmail.trim(),
          services:     services.filter((s) => s.name.trim()),
          hours,
          appointments: validAppts,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setError(data.error ?? "Erro ao enviar convite."); return; }
      onSuccess(collabName.trim());
    } catch {
      setError("Erro inesperado. Tenta novamente.");
    } finally {
      setLoading(false);
    }
  }

  // ── Progress bar ──────────────────────────────────────────────────────────

  const Progress = () => (
    <div className="flex items-center gap-2 mb-6">
      {[1, 2, 3, 4].map((n) => (
        <div key={n} className="flex items-center gap-2">
          <div className={stepLabel(n, step)}>
            {n < step ? <Check size={12} /> : n}
          </div>
          {n < 4 && <div className={`h-px w-5 ${n < step ? "bg-[#00B4D8]" : "bg-white/10"}`} />}
        </div>
      ))}
      <span className="ml-2 text-xs text-slate-500">Passo {step} de 4</span>
    </div>
  );

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="rounded-2xl border border-[#00B4D8]/20 bg-[#1E293B] p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-base font-semibold text-white">Configurar segundo profissional</h2>
          <p className="text-xs text-slate-400 mt-0.5">Os horários e serviços ficam prontos antes de enviar o convite.</p>
        </div>
        <button
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-white/5 hover:text-white transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      <Progress />

      {error && (
        <p className="mb-4 rounded-lg bg-red-500/10 px-3 py-2.5 text-sm text-red-400">{error}</p>
      )}

      {/* ── STEP 1 — Nome & Email ── */}
      {step === 1 && (
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-400">Nome da colaboradora</label>
            <input
              type="text" autoFocus placeholder="Ex: Ana Silva"
              value={collabName} onChange={(e) => setCollabName(e.target.value)}
              className={inputCls}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-400">Email — para o convite</label>
            <input
              type="email" placeholder="ana@email.com"
              value={collabEmail} onChange={(e) => setCollabEmail(e.target.value)}
              className={inputCls}
            />
            <p className="mt-1.5 text-xs text-slate-600">
              Receberá um link para criar a sua conta.
            </p>
          </div>
          <button
            onClick={() => { if (validateStep1()) { setError(""); setStep(2); } }}
            className="w-full rounded-xl bg-[#00B4D8] py-2.5 text-sm font-semibold text-white hover:bg-[#0090b0] transition-colors"
          >
            Próximo
          </button>
        </div>
      )}

      {/* ── STEP 2 — Serviços ── */}
      {step === 2 && (
        <div>
          <div className="hidden sm:grid sm:grid-cols-[1fr_80px_80px_32px] gap-2 mb-2 text-xs font-medium text-slate-500">
            <span>Serviço</span><span className="text-center">Min.</span><span className="text-center">€</span><span />
          </div>
          <div className="space-y-2 mb-3">
            {services.map((svc, i) => (
              <div key={i} className="flex flex-col gap-2 sm:grid sm:grid-cols-[1fr_80px_80px_32px]">
                <div className="flex gap-2 sm:contents">
                  <input
                    type="text" placeholder="Ex: Corte de cabelo"
                    value={svc.name} onChange={(e) => setSvc(i, { name: e.target.value })}
                    className={inputCls + " flex-1"}
                  />
                  <button type="button" onClick={() => setServices((p) => p.filter((_, idx) => idx !== i))}
                    disabled={services.length === 1}
                    className="flex shrink-0 items-center justify-center rounded-lg text-slate-600 hover:text-red-400 disabled:opacity-30 sm:hidden"
                  ><Trash2 size={15} /></button>
                </div>
                <div className="flex gap-2 sm:contents">
                  <input type="number" min={5} max={480} value={svc.duration_minutes}
                    onChange={(e) => setSvc(i, { duration_minutes: Number(e.target.value) })}
                    className={inputCls + " flex-1 text-center sm:flex-none"}
                  />
                  <input type="number" min={0} step={0.5} value={svc.price}
                    onChange={(e) => setSvc(i, { price: Number(e.target.value) })}
                    className={inputCls + " flex-1 text-center sm:flex-none"}
                  />
                  <button type="button" onClick={() => setServices((p) => p.filter((_, idx) => idx !== i))}
                    disabled={services.length === 1}
                    className="hidden sm:flex items-center justify-center rounded-lg text-slate-600 hover:text-red-400 disabled:opacity-30"
                  ><Trash2 size={15} /></button>
                </div>
              </div>
            ))}
          </div>
          <button type="button"
            onClick={() => setServices((p) => [...p, { name: "", duration_minutes: 45, price: 20 }])}
            className="flex items-center gap-1.5 text-sm text-[#00B4D8] hover:text-[#2DD4BF] transition-colors mb-6"
          ><Plus size={15} /> Adicionar serviço</button>
          <div className="flex gap-3">
            <button onClick={() => { setError(""); setStep(1); }}
              className="flex items-center gap-1 rounded-xl border border-white/10 px-4 py-2.5 text-sm text-slate-400 hover:text-white transition-colors"
            ><ChevronLeft size={15} /> Voltar</button>
            <button onClick={() => { if (validateStep2()) { setError(""); setStep(3); } }}
              className="flex-1 rounded-xl bg-[#00B4D8] py-2.5 text-sm font-semibold text-white hover:bg-[#0090b0] transition-colors"
            >Próximo</button>
          </div>
        </div>
      )}

      {/* ── STEP 3 — Horários ── */}
      {step === 3 && (
        <div>
          <div className="space-y-3 mb-6">
            {hours.map((day, i) => (
              <div key={day.day_of_week} className="flex items-center gap-3">
                <button type="button"
                  onClick={() => setDay(i, { is_closed: !day.is_closed })}
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors ${
                    !day.is_closed ? "border-[#00B4D8] bg-[#00B4D8]" : "border-white/20 bg-transparent"
                  }`}
                >
                  {!day.is_closed && <Check size={11} className="text-white" />}
                </button>
                <span className={`w-28 text-sm ${day.is_closed ? "text-slate-600" : "text-slate-300"}`}>
                  {day.label}
                </span>
                {!day.is_closed ? (
                  <div className="flex items-center gap-2">
                    <input type="time" value={day.open_time}
                      onChange={(e) => setDay(i, { open_time: e.target.value })}
                      className="rounded-lg border border-white/10 bg-[#0F172A] px-2 py-1.5 text-sm text-white focus:border-[#00B4D8] focus:outline-none"
                    />
                    <span className="text-slate-600">–</span>
                    <input type="time" value={day.close_time}
                      onChange={(e) => setDay(i, { close_time: e.target.value })}
                      className="rounded-lg border border-white/10 bg-[#0F172A] px-2 py-1.5 text-sm text-white focus:border-[#00B4D8] focus:outline-none"
                    />
                  </div>
                ) : (
                  <span className="text-sm text-slate-600">Fechado</span>
                )}
              </div>
            ))}
          </div>
          <div className="flex gap-3">
            <button onClick={() => { setError(""); setStep(2); }}
              className="flex items-center gap-1 rounded-xl border border-white/10 px-4 py-2.5 text-sm text-slate-400 hover:text-white transition-colors"
            ><ChevronLeft size={15} /> Voltar</button>
            <button onClick={() => { setError(""); setStep(4); }}
              className="flex-1 rounded-xl bg-[#00B4D8] py-2.5 text-sm font-semibold text-white hover:bg-[#0090b0] transition-colors"
            >Próximo</button>
          </div>
        </div>
      )}

      {/* ── STEP 4 — Marcações ── */}
      {step === 4 && (
        <div>
          <p className="mb-4 text-sm text-slate-400">
            Adiciona as marcações que a colaboradora já tem para a próxima semana. Podes saltar se ainda não houver.
          </p>
          {apptRows.length > 0 && (
            <div className="mb-2 grid grid-cols-[1fr_1fr_1fr_1fr_1fr_28px] gap-2 text-xs font-medium text-slate-500">
              <span>Cliente</span><span>Telefone</span><span>Serviço</span><span>Data</span><span>Hora</span><span />
            </div>
          )}
          <div className="space-y-2 mb-3">
            {apptRows.map((appt, i) => (
              <div key={i} className="grid grid-cols-[1fr_1fr_1fr_1fr_1fr_28px] gap-2">
                <input type="text" placeholder="Nome" value={appt.client_name}
                  onChange={(e) => setAppt(i, { client_name: e.target.value })}
                  className={inputCls}
                />
                <input type="tel" placeholder="+351…" value={appt.client_phone}
                  onChange={(e) => setAppt(i, { client_phone: e.target.value })}
                  className={inputCls}
                />
                <select value={appt.service_index}
                  onChange={(e) => setAppt(i, { service_index: Number(e.target.value) })}
                  className={inputCls}
                >
                  {services.filter((s) => s.name.trim()).map((s, idx) => (
                    <option key={idx} value={idx}>{s.name}</option>
                  ))}
                </select>
                <input type="date" value={appt.date}
                  min={isoDate(0)} max={isoDate(14)}
                  onChange={(e) => setAppt(i, { date: e.target.value })}
                  className={inputCls}
                />
                <input type="time" value={appt.time}
                  onChange={(e) => setAppt(i, { time: e.target.value })}
                  className={inputCls}
                />
                <button type="button"
                  onClick={() => setApptRows((p) => p.filter((_, idx) => idx !== i))}
                  className="flex items-center justify-center rounded-lg text-slate-600 hover:text-red-400 transition-colors"
                ><Trash2 size={14} /></button>
              </div>
            ))}
          </div>
          <button type="button"
            onClick={() => setApptRows((p) => [...p, { client_name: "", client_phone: "", service_index: 0, date: isoDate(1), time: "09:00" }])}
            className="flex items-center gap-1.5 text-sm text-[#00B4D8] hover:text-[#2DD4BF] transition-colors mb-6"
          ><Plus size={15} /> Adicionar marcação</button>

          <div className="flex items-center gap-3">
            <button onClick={() => { setError(""); setStep(3); }}
              className="flex items-center gap-1 rounded-xl border border-white/10 px-4 py-2.5 text-sm text-slate-400 hover:text-white transition-colors"
            ><ChevronLeft size={15} /> Voltar</button>
            <button onClick={handleSubmit} disabled={loading}
              className="flex-1 rounded-xl bg-[#00B4D8] py-2.5 text-sm font-semibold text-white hover:bg-[#0090b0] disabled:opacity-50 transition-colors"
            >
              {loading
                ? <span className="flex items-center justify-center gap-2"><Loader2 size={15} className="animate-spin" /> A enviar convite…</span>
                : "Enviar convite ✓"}
            </button>
            <button onClick={handleSubmit} disabled={loading}
              className="text-xs text-slate-600 hover:text-slate-400 transition-colors disabled:opacity-40 whitespace-nowrap"
            >Saltar</button>
          </div>
        </div>
      )}
    </div>
  );
}
