"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Zap, Plus, Trash2, ChevronLeft, Check } from "lucide-react";
import { createSupabaseBrowserClient } from "@/utils/supabase/client";

// ——— Types ———

interface DayConfig {
  day_of_week: number;
  label: string;
  is_closed: boolean;
  open_time: string;
  close_time: string;
}

interface ServiceInput {
  name: string;
  duration_minutes: number;
  price: number;
}

interface SavedService {
  id: string;
  name: string;
  duration_minutes: number;
}

interface ApptInput {
  client_name: string;
  client_phone: string;
  service_id: string;
  date: string;
  time: string;
}

type StepNum = 1 | 2 | 3 | 4 | "done";

// ——— Constants ———

const DEFAULT_HOURS: DayConfig[] = [
  { day_of_week: 1, label: "Segunda-feira", is_closed: false, open_time: "09:00", close_time: "19:00" },
  { day_of_week: 2, label: "Terça-feira",   is_closed: false, open_time: "09:00", close_time: "19:00" },
  { day_of_week: 3, label: "Quarta-feira",  is_closed: false, open_time: "09:00", close_time: "19:00" },
  { day_of_week: 4, label: "Quinta-feira",  is_closed: false, open_time: "09:00", close_time: "19:00" },
  { day_of_week: 5, label: "Sexta-feira",   is_closed: false, open_time: "09:00", close_time: "19:00" },
  { day_of_week: 6, label: "Sábado",        is_closed: true,  open_time: "10:00", close_time: "13:00" },
  { day_of_week: 0, label: "Domingo",       is_closed: true,  open_time: "09:00", close_time: "13:00" },
];

const CATEGORIES = ["Cabeleireira", "Unhas", "Sobrancelhas", "Estética", "Barbearia"];

function isoDate(offsetDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().split("T")[0];
}

const inputCls =
  "w-full rounded-lg border border-white/10 bg-[#0F172A] px-3 py-2 text-sm text-white placeholder-slate-600 focus:border-[#00B4D8] focus:outline-none transition-colors";

// ——— API helpers ———

async function api(path: string, method: string, body?: unknown) {
  const res = await fetch(path, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? "Erro inesperado.");
  return data;
}

// ——— Progress bar ———

function Progress({ step }: { step: StepNum }) {
  const current = step === "done" ? 4 : (step as number);
  return (
    <div className="flex items-center gap-2 mb-8">
      {[1, 2, 3, 4].map((n) => (
        <div key={n} className="flex items-center gap-2">
          <div
            className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
              n < current
                ? "bg-[#00B4D8] text-white"
                : n === current
                ? "bg-[#00B4D8] text-white ring-4 ring-[#00B4D8]/20"
                : "border border-white/10 text-slate-500"
            }`}
          >
            {n < current ? <Check size={12} /> : n}
          </div>
          {n < 4 && (
            <div
              className={`h-px w-8 transition-colors ${n < current ? "bg-[#00B4D8]" : "bg-white/10"}`}
            />
          )}
        </div>
      ))}
      <span className="ml-2 text-xs text-slate-500">
        {step === "done" ? "Concluído" : `Passo ${step} de 4`}
      </span>
    </div>
  );
}

// ——— Main component ———

export default function OnboardingPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [step, setStep] = useState<StepNum>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Step 1
  const [businessName, setBusinessName] = useState("");
  const [category, setCategory] = useState("");

  // Step 2
  const [hours, setHours] = useState<DayConfig[]>(DEFAULT_HOURS);

  // Step 3
  const [serviceRows, setServiceRows] = useState<ServiceInput[]>([
    { name: "", duration_minutes: 45, price: 20 },
  ]);
  const [savedServices, setSavedServices] = useState<SavedService[]>([]);

  // Step 4
  const [apptRows, setApptRows] = useState<ApptInput[]>([]);

  // On mount: check if already onboarded, prefill business name
  useEffect(() => {
    createSupabaseBrowserClient()
      .auth.getUser()
      .then(({ data: { user } }) => {
        if (user?.app_metadata?.onboarding_completed) {
          router.replace("/dashboard");
          return;
        }
        setBusinessName(user?.app_metadata?.business_name ?? "");
        setChecking(false);
      });
  }, [router]);

  const setDay = useCallback(
    (idx: number, patch: Partial<DayConfig>) =>
      setHours((prev) => prev.map((d, i) => (i === idx ? { ...d, ...patch } : d))),
    []
  );

  const setService = useCallback(
    (idx: number, patch: Partial<ServiceInput>) =>
      setServiceRows((prev) => prev.map((s, i) => (i === idx ? { ...s, ...patch } : s))),
    []
  );

  const setAppt = useCallback(
    (idx: number, patch: Partial<ApptInput>) =>
      setApptRows((prev) => prev.map((a, i) => (i === idx ? { ...a, ...patch } : a))),
    []
  );

  // ——— Step handlers ———

  async function handleStep1() {
    if (!category) { setError("Escolhe o tipo de negócio."); return; }
    if (!businessName.trim()) { setError("Indica o nome do negócio."); return; }
    setError(""); setLoading(true);
    try {
      await api("/api/onboarding/step1", "PATCH", { name: businessName, category });
      setStep(2);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function handleStep2() {
    setError(""); setLoading(true);
    try {
      await api("/api/onboarding/step2", "POST", { hours });
      setStep(3);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function handleStep3() {
    const valid = serviceRows.filter((s) => s.name.trim());
    if (valid.length === 0) { setError("Adiciona pelo menos um serviço."); return; }
    setError(""); setLoading(true);
    try {
      const data = await api("/api/onboarding/step3", "POST", { services: valid });
      setSavedServices(data.services ?? []);
      setStep(4);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function handleStep4(skip = false) {
    setError(""); setLoading(true);
    try {
      if (!skip && apptRows.length > 0) {
        const valid = apptRows.filter(
          (a) => a.client_name.trim() && a.client_phone.trim() && a.service_id && a.date && a.time
        );
        if (valid.length > 0) {
          await api("/api/onboarding/step4", "POST", { appointments: valid });
        }
      }
      await api("/api/onboarding/complete", "POST");
      await createSupabaseBrowserClient().auth.refreshSession();
      setStep("done");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  if (checking) return <div className="min-h-screen bg-[#0F172A]" />;

  // ——— Done screen ———
  if (step === "done") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0F172A] p-4">
        <div className="w-full max-w-sm text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[#2DD4BF]/15">
            <Check size={32} className="text-[#2DD4BF]" />
          </div>
          <h1 className="mb-2 text-2xl font-bold text-white">Tudo configurado!</h1>
          <p className="mb-2 text-slate-400">
            Em 24 horas o teu número estará ativo.
          </p>
          <p className="mb-8 text-slate-400">
            Vais começar a recuperar vagas automaticamente.
          </p>
          <button
            onClick={() => router.push("/dashboard")}
            className="w-full rounded-xl bg-[#00B4D8] py-3 font-semibold text-white transition-colors hover:bg-[#0090b0]"
          >
            Ir para o Dashboard
          </button>
        </div>
      </div>
    );
  }

  // ——— Shared shell ———
  return (
    <div className="min-h-screen bg-[#0F172A] p-4">
      <div className="mx-auto max-w-lg">
        {/* Logo */}
        <div className="mb-8 flex items-center gap-3 pt-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#00B4D8]">
            <Zap size={18} className="text-white" fill="white" />
          </div>
          <p className="text-base font-bold tracking-wide text-white">VagasIA</p>
        </div>

        <Progress step={step} />

        {error && (
          <p className="mb-4 rounded-lg bg-red-500/10 px-3 py-2.5 text-sm text-red-400">{error}</p>
        )}

        {/* ——— Step 1 ——— */}
        {step === 1 && (
          <div className="rounded-2xl border border-white/5 bg-[#1E293B] p-6">
            <h1 className="mb-1 text-xl font-bold text-white">Bem-vinda ao VagasIA!</h1>
            <p className="mb-6 text-sm text-slate-400">Vamos configurar o teu negócio em 4 passos.</p>

            <div className="mb-5">
              <label className="mb-1.5 block text-sm font-medium text-slate-400">Nome do negócio</label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="Ex: Cabeleireira Ana Silva"
                className={inputCls}
              />
            </div>

            <div>
              <label className="mb-3 block text-sm font-medium text-slate-400">Tipo de serviço</label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`rounded-xl border px-4 py-3 text-sm font-medium transition-colors ${
                      category === cat
                        ? "border-[#00B4D8] bg-[#00B4D8]/10 text-[#00B4D8]"
                        : "border-white/10 text-slate-400 hover:border-white/20 hover:text-white"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleStep1}
              disabled={loading}
              className="mt-6 w-full rounded-xl bg-[#00B4D8] py-3 font-semibold text-white transition-colors hover:bg-[#0090b0] disabled:opacity-50"
            >
              {loading ? "A guardar…" : "Próximo"}
            </button>
          </div>
        )}

        {/* ——— Step 2 ——— */}
        {step === 2 && (
          <div className="rounded-2xl border border-white/5 bg-[#1E293B] p-6">
            <h1 className="mb-1 text-xl font-bold text-white">Quando trabalhas?</h1>
            <p className="mb-6 text-sm text-slate-400">Define os teus dias e horários de trabalho.</p>

            <div className="space-y-3">
              {hours.map((day, idx) => (
                <div key={day.day_of_week} className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setDay(idx, { is_closed: !day.is_closed })}
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors ${
                      !day.is_closed
                        ? "border-[#00B4D8] bg-[#00B4D8]"
                        : "border-white/20 bg-transparent"
                    }`}
                  >
                    {!day.is_closed && <Check size={11} className="text-white" />}
                  </button>
                  <span className={`w-28 text-sm ${day.is_closed ? "text-slate-600" : "text-slate-300"}`}>
                    {day.label}
                  </span>
                  {!day.is_closed ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="time"
                        value={day.open_time}
                        onChange={(e) => setDay(idx, { open_time: e.target.value })}
                        className="rounded-lg border border-white/10 bg-[#0F172A] px-2 py-1.5 text-sm text-white focus:border-[#00B4D8] focus:outline-none"
                      />
                      <span className="text-slate-600">–</span>
                      <input
                        type="time"
                        value={day.close_time}
                        onChange={(e) => setDay(idx, { close_time: e.target.value })}
                        className="rounded-lg border border-white/10 bg-[#0F172A] px-2 py-1.5 text-sm text-white focus:border-[#00B4D8] focus:outline-none"
                      />
                    </div>
                  ) : (
                    <span className="text-sm text-slate-600">Fechado</span>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="flex items-center gap-1 rounded-xl border border-white/10 px-4 py-3 text-sm text-slate-400 transition-colors hover:text-white"
              >
                <ChevronLeft size={16} /> Voltar
              </button>
              <button
                onClick={handleStep2}
                disabled={loading}
                className="flex-1 rounded-xl bg-[#00B4D8] py-3 font-semibold text-white transition-colors hover:bg-[#0090b0] disabled:opacity-50"
              >
                {loading ? "A guardar…" : "Próximo"}
              </button>
            </div>
          </div>
        )}

        {/* ——— Step 3 ——— */}
        {step === 3 && (
          <div className="rounded-2xl border border-white/5 bg-[#1E293B] p-6">
            <h1 className="mb-1 text-xl font-bold text-white">Os teus serviços</h1>
            <p className="mb-6 text-sm text-slate-400">Adiciona os serviços que ofereces.</p>

            <div className="mb-2 grid grid-cols-[1fr_80px_80px_32px] gap-2 text-xs font-medium text-slate-500">
              <span>Serviço</span>
              <span className="text-center">Duração (min)</span>
              <span className="text-center">Preço (€)</span>
              <span />
            </div>

            <div className="space-y-2">
              {serviceRows.map((svc, idx) => (
                <div key={idx} className="grid grid-cols-[1fr_80px_80px_32px] gap-2">
                  <input
                    type="text"
                    placeholder="Ex: Corte de cabelo"
                    value={svc.name}
                    onChange={(e) => setService(idx, { name: e.target.value })}
                    className={inputCls}
                  />
                  <input
                    type="number"
                    min={5}
                    max={480}
                    value={svc.duration_minutes}
                    onChange={(e) => setService(idx, { duration_minutes: Number(e.target.value) })}
                    className={inputCls + " text-center"}
                  />
                  <input
                    type="number"
                    min={0}
                    step={0.5}
                    value={svc.price}
                    onChange={(e) => setService(idx, { price: Number(e.target.value) })}
                    className={inputCls + " text-center"}
                  />
                  <button
                    type="button"
                    onClick={() => setServiceRows((prev) => prev.filter((_, i) => i !== idx))}
                    disabled={serviceRows.length === 1}
                    className="flex items-center justify-center rounded-lg text-slate-600 transition-colors hover:text-red-400 disabled:opacity-30"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() =>
                setServiceRows((prev) => [...prev, { name: "", duration_minutes: 45, price: 20 }])
              }
              className="mt-3 flex items-center gap-1.5 text-sm text-[#00B4D8] hover:text-[#2DD4BF] transition-colors"
            >
              <Plus size={15} /> Adicionar serviço
            </button>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setStep(2)}
                className="flex items-center gap-1 rounded-xl border border-white/10 px-4 py-3 text-sm text-slate-400 transition-colors hover:text-white"
              >
                <ChevronLeft size={16} /> Voltar
              </button>
              <button
                onClick={handleStep3}
                disabled={loading}
                className="flex-1 rounded-xl bg-[#00B4D8] py-3 font-semibold text-white transition-colors hover:bg-[#0090b0] disabled:opacity-50"
              >
                {loading ? "A guardar…" : "Próximo"}
              </button>
            </div>
          </div>
        )}

        {/* ——— Step 4 ——— */}
        {step === 4 && (
          <div className="rounded-2xl border border-white/5 bg-[#1E293B] p-6">
            <h1 className="mb-1 text-xl font-bold text-white">Marcações da próxima semana</h1>
            <p className="mb-6 text-sm text-slate-400">
              Carrega as marcações que já tens agendadas. Podes saltar este passo.
            </p>

            {apptRows.length > 0 && (
              <div className="mb-2 grid grid-cols-[1fr_1fr_1fr_1fr_1fr_28px] gap-2 text-xs font-medium text-slate-500">
                <span>Cliente</span>
                <span>Telefone</span>
                <span>Serviço</span>
                <span>Data</span>
                <span>Hora</span>
                <span />
              </div>
            )}

            <div className="space-y-2">
              {apptRows.map((appt, idx) => (
                <div key={idx} className="grid grid-cols-[1fr_1fr_1fr_1fr_1fr_28px] gap-2">
                  <input
                    type="text"
                    placeholder="Nome"
                    value={appt.client_name}
                    onChange={(e) => setAppt(idx, { client_name: e.target.value })}
                    className={inputCls}
                  />
                  <input
                    type="tel"
                    placeholder="+351…"
                    value={appt.client_phone}
                    onChange={(e) => setAppt(idx, { client_phone: e.target.value })}
                    className={inputCls}
                  />
                  <select
                    value={appt.service_id}
                    onChange={(e) => setAppt(idx, { service_id: e.target.value })}
                    className={inputCls}
                  >
                    <option value="">Serviço</option>
                    {savedServices.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                  <input
                    type="date"
                    value={appt.date}
                    min={isoDate(0)}
                    max={isoDate(14)}
                    onChange={(e) => setAppt(idx, { date: e.target.value })}
                    className={inputCls}
                  />
                  <input
                    type="time"
                    value={appt.time}
                    onChange={(e) => setAppt(idx, { time: e.target.value })}
                    className={inputCls}
                  />
                  <button
                    type="button"
                    onClick={() => setApptRows((prev) => prev.filter((_, i) => i !== idx))}
                    className="flex items-center justify-center rounded-lg text-slate-600 transition-colors hover:text-red-400"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() =>
                setApptRows((prev) => [
                  ...prev,
                  { client_name: "", client_phone: "", service_id: "", date: isoDate(1), time: "09:00" },
                ])
              }
              className="mt-3 flex items-center gap-1.5 text-sm text-[#00B4D8] hover:text-[#2DD4BF] transition-colors"
            >
              <Plus size={15} /> Adicionar marcação
            </button>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setStep(3)}
                className="flex items-center gap-1 rounded-xl border border-white/10 px-4 py-3 text-sm text-slate-400 transition-colors hover:text-white"
              >
                <ChevronLeft size={16} /> Voltar
              </button>
              <button
                onClick={() => handleStep4(true)}
                disabled={loading}
                className="rounded-xl border border-white/10 px-5 py-3 text-sm text-slate-400 transition-colors hover:text-white disabled:opacity-50"
              >
                Saltar
              </button>
              <button
                onClick={() => handleStep4(false)}
                disabled={loading}
                className="flex-1 rounded-xl bg-[#00B4D8] py-3 font-semibold text-white transition-colors hover:bg-[#0090b0] disabled:opacity-50"
              >
                {loading ? "A guardar…" : "Concluir"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
