"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Zap, Plus, Trash2, ChevronLeft, Check, LogOut, Upload } from "lucide-react";
import { createSupabaseBrowserClient } from "@/utils/supabase/client";
import { parseCsv, type ParsedClient } from "@/lib/csv";

const SOFIA_AVATAR =
  "https://assets.cdn.filesafe.space/MgsViYLMmCdJksx9p3va/media/69e8ba57a1636a6c65273241.png";

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

type StepNum = 1 | 2 | 3 | 4 | 5 | 6 | "done";

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

const CATEGORIES = [
  "Cabeleireira",
  "Barbearia",
  "Unhas & Manicure",
  "Sobrancelhas & Lashes",
  "Estética & Spa",
  "Fisioterapeuta",
  "Nutricionista",
  "Psicólogo/a",
  "Médico/a",
  "Dentista",
  "Personal Trainer",
  "Advogado/a",
  "Contabilista",
  "Consultor",
  "Coach",
  "Terapeuta",
  "Fotógrafo/a",
  "Outra profissão",
];

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

// ——— Step 5: Os teus clientes ———

type ClientOption = "phone" | "excel" | "manual" | null;

interface ManualClient {
  name: string;
  phone: string;
}

function CsvUploadZone({
  onImported,
}: {
  onImported: (count: number) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [parsed, setParsed] = useState<ParsedClient[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [fileName, setFileName] = useState("");
  const [importing, setImporting] = useState(false);
  const [done, setDone] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setDone(false);
    setImportError(null);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const { clients, errors } = parseCsv(text);
      setParsed(clients);
      setParseErrors(errors);
    };
    reader.readAsText(file, "UTF-8");
  }

  async function handleImport() {
    setImporting(true);
    setImportError(null);
    try {
      const res = await fetch("/api/clients/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clients: parsed }),
      });
      const data = await res.json();
      if (!res.ok) { setImportError(data.error ?? "Erro ao importar."); return; }
      setDone(true);
      onImported(data.imported ?? parsed.length);
    } catch {
      setImportError("Erro de ligação. Tenta novamente.");
    } finally {
      setImporting(false);
    }
  }

  if (done) {
    return (
      <div className="mt-3 rounded-lg border border-[#2DD4BF]/20 bg-[#2DD4BF]/5 px-4 py-3 text-sm text-[#2DD4BF]">
        ✅ Clientes importados com sucesso!
      </div>
    );
  }

  return (
    <div className="mt-3 space-y-3">
      {/* Aviso WhatsApp */}
      <div className="flex gap-2 rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-3 py-2.5">
        <span className="shrink-0">⚠️</span>
        <p className="text-xs text-yellow-200 leading-relaxed">
          Cada cliente receberá uma mensagem de boas-vindas no WhatsApp.
        </p>
      </div>

      {/* Zona de upload */}
      <div
        className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed border-white/10 bg-[#0F172A] py-5 transition-colors hover:border-[#00B4D8]/40"
        onClick={() => fileRef.current?.click()}
      >
        <Upload size={20} className="text-slate-500" />
        <p className="text-sm text-slate-400">
          {fileName ? fileName : "Clica para selecionar o ficheiro CSV"}
        </p>
        <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={handleFile} />
      </div>

      {/* Preview */}
      {parsed.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-slate-400">
            <span className="font-semibold text-white">{parsed.length}</span> clientes encontrados — pré-visualização:
          </p>
          <div className="rounded-lg border border-white/5 overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-white/5 text-[10px] uppercase text-slate-500">
                  <th className="px-3 py-1.5 text-left">Nome</th>
                  <th className="px-3 py-1.5 text-left">Telefone</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {parsed.slice(0, 3).map((c, i) => (
                  <tr key={i} className="bg-[#0F172A]">
                    <td className="px-3 py-1.5 text-slate-200">{c.name}</td>
                    <td className="px-3 py-1.5 text-slate-400">{c.phone}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {parsed.length > 3 && (
              <p className="px-3 py-1.5 text-[10px] text-slate-600 bg-[#0F172A] border-t border-white/5">
                + {parsed.length - 3} mais clientes
              </p>
            )}
          </div>
          {parseErrors.length > 0 && (
            <p className="text-xs text-red-400">{parseErrors.length} linha(s) com erro ignoradas.</p>
          )}
          {importError && <p className="text-xs text-red-400">{importError}</p>}
          <button
            onClick={handleImport}
            disabled={importing}
            className="w-full rounded-lg bg-[#00B4D8] py-2 text-sm font-semibold text-white hover:bg-[#0090b0] disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            {importing ? <><span className="animate-spin">⏳</span> A importar…</> : `Importar ${parsed.length} clientes`}
          </button>
        </div>
      )}

      {parseErrors.length > 0 && parsed.length === 0 && (
        <p className="text-xs text-red-400">{parseErrors[0]}</p>
      )}
    </div>
  );
}

function StepClientes({ onBack, onNext }: { onBack: () => void; onNext: () => void }) {
  const [selected, setSelected] = useState<ClientOption>(null);
  const [imported, setImported]  = useState(false);
  const [escaped, setEscaped]    = useState(false);

  // Manual clients
  const [manualForm, setManualForm] = useState({ name: "", phone: "" });
  const [manualList, setManualList] = useState<ManualClient[]>([]);
  const [manualSaving, setManualSaving] = useState(false);
  const [manualError, setManualError]   = useState<string | null>(null);

  const canProceed = imported || manualList.length > 0 || escaped;

  function handleOption(opt: ClientOption) {
    setSelected((prev) => (prev === opt ? null : opt));
    setEscaped(false);
  }

  async function handleAddManual() {
    if (!manualForm.name.trim() || !manualForm.phone.trim()) {
      setManualError("Nome e telefone são obrigatórios.");
      return;
    }
    setManualSaving(true);
    setManualError(null);
    try {
      const res = await fetch("/api/clients/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clients: [{ name: manualForm.name.trim(), phone: manualForm.phone.trim() }] }),
      });
      const data = await res.json();
      if (!res.ok) { setManualError(data.error ?? "Erro ao guardar."); return; }
      setManualList((prev) => [...prev, { name: manualForm.name.trim(), phone: manualForm.phone.trim() }]);
      setManualForm({ name: "", phone: "" });
      setImported(true);
    } catch {
      setManualError("Erro de ligação.");
    } finally {
      setManualSaving(false);
    }
  }

  const optionBase = "rounded-xl border px-4 py-3.5 text-left transition-colors cursor-pointer";
  const optionActive = "border-[#00B4D8] bg-[#00B4D8]/10";
  const optionIdle   = "border-white/10 hover:border-white/20 bg-white/[0.02]";

  return (
    <div className="rounded-2xl border border-white/5 bg-[#1E293B] p-6">
      <h1 className="mb-1 text-xl font-bold text-white">Os teus clientes são o coração do teu negócio</h1>
      <p className="mb-6 text-sm text-slate-400 leading-relaxed">
        Para que o VagasIA envie lembretes, recupere vagas e fidelize os teus clientes, precisamos da tua lista.
        Sem clientes, é como ter uma secretária sem agenda.
      </p>

      <div className="space-y-3">

        {/* Opção 1 — Telemóvel */}
        <div>
          <button
            type="button"
            onClick={() => handleOption("phone")}
            className={`${optionBase} ${selected === "phone" ? optionActive : optionIdle} w-full`}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">📱</span>
              <div>
                <p className="text-sm font-semibold text-white">Tenho no telemóvel</p>
                <p className="text-xs text-slate-500 mt-0.5">Exportar contactos e importar aqui</p>
              </div>
            </div>
          </button>
          {selected === "phone" && (
            <div className="mt-2 ml-1 rounded-xl border border-white/5 bg-[#0F172A] p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs font-semibold text-slate-300 mb-1.5">🍎 iPhone</p>
                  <ol className="space-y-1 text-xs text-slate-500 list-decimal list-inside">
                    <li>Definições → [teu nome]</li>
                    <li>iCloud → Contactos</li>
                    <li>Exportar .vcf → converter para CSV</li>
                  </ol>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-300 mb-1.5">🤖 Android</p>
                  <ol className="space-y-1 text-xs text-slate-500 list-decimal list-inside">
                    <li>Contactos → Menu</li>
                    <li>Exportar → Guardar como .vcf</li>
                    <li>Converter para CSV</li>
                  </ol>
                </div>
              </div>
              <p className="text-xs text-slate-500">Exporta os teus contactos e importa o ficheiro aqui em baixo</p>
              <CsvUploadZone onImported={() => setImported(true)} />
            </div>
          )}
        </div>

        {/* Opção 2 — Excel */}
        <div>
          <button
            type="button"
            onClick={() => handleOption("excel")}
            className={`${optionBase} ${selected === "excel" ? optionActive : optionIdle} w-full`}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">📊</span>
              <div>
                <p className="text-sm font-semibold text-white">Tenho numa lista ou Excel</p>
                <p className="text-xs text-slate-500 mt-0.5">Guardar como CSV e importar</p>
              </div>
            </div>
          </button>
          {selected === "excel" && (
            <div className="mt-2 ml-1 rounded-xl border border-white/5 bg-[#0F172A] p-4 space-y-3">
              <div className="space-y-2">
                {[
                  "Abre o Excel ou Google Sheets",
                  "Cria 2 colunas: nome e telefone (ex: +351912345678)",
                  "Ficheiro → Guardar como → CSV",
                ].map((step, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="shrink-0 text-base font-bold text-[#00B4D8]">{i + 1}</span>
                    <p className="text-xs text-slate-400 leading-relaxed pt-0.5">{step}</p>
                  </div>
                ))}
              </div>
              <CsvUploadZone onImported={() => setImported(true)} />
            </div>
          )}
        </div>

        {/* Opção 3 — Manual */}
        <div>
          <button
            type="button"
            onClick={() => handleOption("manual")}
            className={`${optionBase} ${selected === "manual" ? optionActive : optionIdle} w-full`}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">✍️</span>
              <div>
                <p className="text-sm font-semibold text-white">Vou adicionar um a um</p>
                <p className="text-xs text-slate-500 mt-0.5">Recomendado: mínimo 3 clientes</p>
              </div>
            </div>
          </button>
          {selected === "manual" && (
            <div className="mt-2 ml-1 rounded-xl border border-white/5 bg-[#0F172A] p-4 space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Nome"
                  value={manualForm.name}
                  onChange={(e) => setManualForm((f) => ({ ...f, name: e.target.value }))}
                  className="flex-1 rounded-lg border border-white/10 bg-[#1E293B] px-3 py-2 text-sm text-white placeholder-slate-600 focus:border-[#00B4D8] focus:outline-none"
                />
                <input
                  type="tel"
                  placeholder="+351…"
                  value={manualForm.phone}
                  onChange={(e) => setManualForm((f) => ({ ...f, phone: e.target.value }))}
                  className="flex-1 rounded-lg border border-white/10 bg-[#1E293B] px-3 py-2 text-sm text-white placeholder-slate-600 focus:border-[#00B4D8] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddManual}
                  disabled={manualSaving}
                  className="flex items-center gap-1 rounded-lg bg-[#00B4D8] px-3 py-2 text-sm font-medium text-white hover:bg-[#0090b0] disabled:opacity-50 transition-colors whitespace-nowrap"
                >
                  <Plus size={14} /> Adicionar
                </button>
              </div>
              {manualError && <p className="text-xs text-red-400">{manualError}</p>}
              {manualList.length > 0 && (
                <div className="space-y-1">
                  {manualList.map((c, i) => (
                    <div key={i} className="flex items-center justify-between rounded-lg bg-[#1E293B] px-3 py-2">
                      <p className="text-xs text-slate-300">{c.name}</p>
                      <p className="text-xs text-slate-500">{c.phone}</p>
                    </div>
                  ))}
                  {manualList.length < 3 && (
                    <p className="text-xs text-slate-600 text-center pt-1">
                      Adiciona mais {3 - manualList.length} para atingir o mínimo recomendado
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Escape honesto */}
      {!escaped ? (
        <button
          type="button"
          onClick={() => { setEscaped(true); setSelected(null); }}
          className="mt-5 w-full text-center text-xs text-slate-600 hover:text-slate-400 transition-colors py-1"
        >
          O meu negócio é novo e ainda não tenho clientes
        </button>
      ) : (
        <div className="mt-5 rounded-xl border border-[#2DD4BF]/20 bg-[#2DD4BF]/5 px-4 py-3 space-y-3">
          <p className="text-sm text-slate-300 leading-relaxed">
            Sem problema! Quando tiveres os teus primeiros clientes, vai a{" "}
            <span className="font-semibold text-white">Clientes → Importar CSV</span>. Quanto mais completa
            estiver a tua lista, mais o sistema trabalha por ti. 💚
          </p>
          <button
            type="button"
            onClick={onNext}
            className="w-full rounded-xl bg-[#00B4D8] py-2.5 text-sm font-semibold text-white hover:bg-[#0090b0] transition-colors"
          >
            Continuar →
          </button>
        </div>
      )}

      {/* Navegação */}
      {!escaped && (
        <div className="mt-4 flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-1 rounded-xl border border-white/10 px-4 py-3 text-sm text-slate-400 transition-colors hover:text-white"
          >
            <ChevronLeft size={16} /> Voltar
          </button>
          <button
            onClick={onNext}
            disabled={!canProceed}
            className="flex-1 rounded-xl bg-[#00B4D8] py-3 font-semibold text-white transition-colors hover:bg-[#0090b0] disabled:cursor-not-allowed disabled:opacity-40"
          >
            Próximo →
          </button>
        </div>
      )}

      {!canProceed && !escaped && (
        <p className="mt-2 text-center text-xs text-slate-600">
          Importa clientes ou usa a opção abaixo para continuar
        </p>
      )}
    </div>
  );
}

// ——— Progress bar ———

function Progress({ step, total = 6 }: { step: StepNum; total?: number }) {
  const current = step === "done" ? total : (step as number);
  return (
    <div className="flex items-center gap-2 mb-8">
      {Array.from({ length: total }, (_, i) => i + 1).map((n) => (
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
          {n < total && (
            <div
              className={`h-px w-6 transition-colors ${n < current ? "bg-[#00B4D8]" : "bg-white/10"}`}
            />
          )}
        </div>
      ))}
      <span className="ml-2 text-xs text-slate-500">
        {step === "done" ? "Concluído" : `Passo ${step} de ${total}`}
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
  const [dedicatedAccepted, setDedicatedAccepted] = useState(false);
  const [error, setError] = useState("");

  // Step 1
  const [businessName, setBusinessName] = useState("");
  const [category, setCategory] = useState("");
  const [customCategory, setCustomCategory] = useState("");
  // Nombre personal del usuario (de auth metadata) — usado en el Mensaje A de Sofía
  const [userName, setUserName] = useState("");

  // Step 2
  const [hours, setHours] = useState<DayConfig[]>(DEFAULT_HOURS);

  // Step 3
  const [serviceRows, setServiceRows] = useState<ServiceInput[]>([
    { name: "", duration_minutes: 45, price: 20 },
  ]);
  const [savedServices, setSavedServices] = useState<SavedService[]>([]);

  // Step 4
  const [apptRows, setApptRows] = useState<ApptInput[]>([]);

  async function handleLogout() {
    await createSupabaseBrowserClient().auth.signOut();
    window.location.href = "/login";
  }

  // On mount: check if already onboarded, prefill business name and personal name
  useEffect(() => {
    createSupabaseBrowserClient()
      .auth.getUser()
      .then(({ data: { user } }) => {
        if (user?.app_metadata?.onboarding_completed) {
          router.replace("/dashboard");
          return;
        }
        setBusinessName(user?.app_metadata?.business_name ?? "");
        // Nombre personal del usuario (guardado en user_metadata al registrarse)
        const name = (user?.user_metadata?.name as string | undefined) ?? "";
        setUserName(name);
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
    if (category === "Outra profissão" && !customCategory.trim()) {
      setError("Indica a tua profissão."); return;
    }
    if (!businessName.trim()) { setError("Indica o nome do negócio."); return; }
    const finalCategory = category === "Outra profissão" ? customCategory.trim() : category;
    setError(""); setLoading(true);
    try {
      await api("/api/onboarding/step1", "PATCH", { name: businessName, category: finalCategory });
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
      // Guardar el nombre para que Sofía muestre el Mensaje A al terminar el onboarding
      const displayName = userName.trim() || businessName.trim() || "cliente";
      localStorage.setItem(
        "sofia_onboarding_welcome",
        JSON.stringify({ name: displayName, shown: false })
      );
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
          <p className="mb-6 text-slate-400">
            O teu período de teste gratuito de 7 dias começou. Explora o VagasIA sem compromisso.
          </p>

          {/* Bloco Sofía */}
          <div className="mb-8 flex items-center gap-4 rounded-2xl border border-[#2DD4BF]/20 bg-[#2DD4BF]/5 px-4 py-4 text-left">
            <Image
              src={SOFIA_AVATAR}
              alt="Sofía"
              width={56}
              height={56}
              className="h-14 w-14 shrink-0 rounded-full object-cover ring-2 ring-[#2DD4BF]/30"
            />
            <p className="text-sm leading-relaxed text-slate-300">
              A tua assistente <span className="font-semibold text-white">Sofía</span> está disponível 24/7. Sempre que precisares de ajuda, clica na Sofía — nunca estás sozinho/a 💚
            </p>
          </div>

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
        {/* Logo + logout */}
        <div className="mb-8 flex items-center justify-between pt-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#00B4D8]">
              <Zap size={18} className="text-white" fill="white" />
            </div>
            <p className="text-base font-bold tracking-wide text-white">VagasIA</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-slate-500 transition-colors hover:bg-white/5 hover:text-slate-300"
          >
            <LogOut size={15} />
            Sair
          </button>
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
                    onClick={() => {
                      setCategory(cat);
                      if (cat !== "Outra profissão") setCustomCategory("");
                    }}
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

              {category === "Outra profissão" && (
                <div className="mt-3">
                  <input
                    type="text"
                    autoFocus
                    placeholder="Ex: Arquiteta, Coach, Terapeuta..."
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    className={inputCls}
                  />
                </div>
              )}
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

            <div className="mb-2 hidden sm:grid sm:grid-cols-[1fr_80px_80px_32px] gap-2 text-xs font-medium text-slate-500">
              <span>Serviço</span>
              <span className="text-center">Dur.</span>
              <span className="text-center">€</span>
              <span />
            </div>

            <div className="space-y-2">
              {serviceRows.map((svc, idx) => (
                <div key={idx} className="flex flex-col gap-2 sm:grid sm:grid-cols-[1fr_80px_80px_32px]">
                  {/* Mobile row 1: name full width + delete button */}
                  <div className="flex gap-2 sm:contents">
                    <input
                      type="text"
                      placeholder="Ex: Corte de cabelo"
                      value={svc.name}
                      onChange={(e) => setService(idx, { name: e.target.value })}
                      className={inputCls + " flex-1"}
                    />
                    {/* Delete — visible on mobile only; desktop version below */}
                    <button
                      type="button"
                      onClick={() => setServiceRows((prev) => prev.filter((_, i) => i !== idx))}
                      disabled={serviceRows.length === 1}
                      className="flex shrink-0 items-center justify-center rounded-lg text-slate-600 transition-colors hover:text-red-400 disabled:opacity-30 sm:hidden"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                  {/* Mobile row 2: duration + price side by side */}
                  <div className="flex gap-2 sm:contents">
                    <input
                      type="number"
                      min={5}
                      max={480}
                      value={svc.duration_minutes}
                      onChange={(e) => setService(idx, { duration_minutes: Number(e.target.value) })}
                      className={inputCls + " flex-1 text-center sm:flex-none"}
                    />
                    <input
                      type="number"
                      min={0}
                      step={0.5}
                      value={svc.price}
                      onChange={(e) => setService(idx, { price: Number(e.target.value) })}
                      className={inputCls + " flex-1 text-center sm:flex-none"}
                    />
                    {/* Delete — desktop only */}
                    <button
                      type="button"
                      onClick={() => setServiceRows((prev) => prev.filter((_, i) => i !== idx))}
                      disabled={serviceRows.length === 1}
                      className="hidden sm:flex items-center justify-center rounded-lg text-slate-600 transition-colors hover:text-red-400 disabled:opacity-30"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
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
              Para que o sistema comece a trabalhar por ti durante os 7 dias, adiciona as marcações que já tens. Se o teu negócio é novo e ainda não tens marcações, podes saltar.
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

            <div className="mt-6 flex items-center gap-3">
              <button
                onClick={() => setStep(3)}
                className="flex items-center gap-1 rounded-xl border border-white/10 px-4 py-3 text-sm text-slate-400 transition-colors hover:text-white"
              >
                <ChevronLeft size={16} /> Voltar
              </button>
              <button
                onClick={async () => {
                  // Guardar marcações antes de avanzar a la pantalla de aceptación
                  setError(""); setLoading(true);
                  try {
                    if (apptRows.length > 0) {
                      const valid = apptRows.filter(
                        (a) => a.client_name.trim() && a.client_phone.trim() && a.service_id && a.date && a.time
                      );
                      if (valid.length > 0) {
                        await api("/api/onboarding/step4", "POST", { appointments: valid });
                      }
                    }
                    setStep(5);
                  } catch (e) {
                    setError((e as Error).message);
                  } finally {
                    setLoading(false);
                  }
                }}
                disabled={loading}
                className="flex-1 rounded-xl bg-[#00B4D8] py-3 font-semibold text-white transition-colors hover:bg-[#0090b0] disabled:opacity-50"
              >
                {loading ? "A guardar…" : "Seguinte →"}
              </button>
              <button
                onClick={() => setStep(5)}
                disabled={loading}
                className="text-xs text-slate-600 hover:text-slate-400 transition-colors disabled:opacity-40 whitespace-nowrap"
              >
                Saltar →
              </button>
            </div>
          </div>
        )}

        {/* ——— Step 5 — Os teus clientes ——— */}
        {step === 5 && <StepClientes onBack={() => setStep(4)} onNext={() => setStep(6)} />}

        {/* ——— Step 6 — Número dedicado ——— */}
        {step === 6 && (
          <div className="rounded-2xl border border-white/5 bg-[#1E293B] p-6">
            {/* Ícono */}
            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#00B4D8]/10">
              <span className="text-2xl">📱</span>
            </div>

            <h1 className="mb-2 text-xl font-bold text-white">O teu número dedicado WhatsApp</h1>
            <p className="mb-4 text-sm text-slate-400 leading-relaxed">
              Para proteger o teu negócio e o teu número pessoal, vamos atribuir-te um número WhatsApp dedicado exclusivamente às tuas marcações.
            </p>

            {/* Aviso Meta */}
            <div className="mb-4 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3">
              <p className="text-sm text-amber-300 leading-relaxed font-medium mb-1">⚠️ Porquê um número separado?</p>
              <p className="text-sm text-slate-400 leading-relaxed">
                A Meta (empresa do WhatsApp) não permite misturar números pessoais com automações. Se o fizéssemos, o teu número pessoal poderia ser bloqueado permanentemente — e perderias o contacto com todos os teus clientes.
              </p>
            </div>

            <p className="mb-4 text-sm text-slate-400 leading-relaxed">
              Pensando sempre na tua segurança, nós fornecemos-te um número dedicado apenas para o WhatsApp do teu negócio. Este número:
            </p>

            {/* Beneficios */}
            <div className="mb-6 space-y-2">
              {[
                "Não é o teu número pessoal",
                "É usado exclusivamente para marcações",
                "Está incluído no teu plano — sem custo extra",
                "É gerido por nós com total segurança",
              ].map((text) => (
                <div key={text} className="flex items-start gap-2 rounded-xl bg-white/[0.03] px-4 py-2.5">
                  <span className="mt-0.5 text-base shrink-0">✅</span>
                  <p className="text-sm text-slate-300 leading-relaxed">{text}</p>
                </div>
              ))}
            </div>

            {/* Checkbox de aceptación */}
            <label className="mb-6 flex cursor-pointer items-start gap-3 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-4 transition-colors hover:bg-white/[0.04]">
              <div className="mt-0.5 shrink-0">
                <input
                  type="checkbox"
                  checked={dedicatedAccepted}
                  onChange={(e) => setDedicatedAccepted(e.target.checked)}
                  className="sr-only"
                />
                <div
                  className={`flex h-5 w-5 items-center justify-center rounded-md border-2 transition-colors ${
                    dedicatedAccepted
                      ? "border-[#00B4D8] bg-[#00B4D8]"
                      : "border-white/20 bg-transparent"
                  }`}
                >
                  {dedicatedAccepted && <Check size={11} className="text-white" strokeWidth={3} />}
                </div>
              </div>
              <span className="text-sm text-slate-300 leading-relaxed">
                Entendi e aceito receber um número dedicado para o meu negócio
              </span>
            </label>

            {/* Botones */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setStep(5)}
                className="flex items-center gap-1 rounded-xl border border-white/10 px-4 py-3 text-sm text-slate-400 transition-colors hover:text-white"
              >
                <ChevronLeft size={16} /> Voltar
              </button>
              <button
                onClick={() => handleStep4(true)}
                disabled={!dedicatedAccepted || loading}
                className="flex-1 rounded-xl bg-[#00B4D8] py-3 font-semibold text-white transition-colors hover:bg-[#0090b0] disabled:cursor-not-allowed disabled:opacity-40"
              >
                {loading ? "A finalizar…" : "Concluir ✓"}
              </button>
            </div>

            {!dedicatedAccepted && (
              <p className="mt-3 text-center text-xs text-slate-600">
                Marca a caixa acima para poder concluir
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
