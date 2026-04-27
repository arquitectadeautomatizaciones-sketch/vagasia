"use client";

import { useState } from "react";
import AppLayout from "@/components/AppLayout";
import {
  Building2,
  Scissors,
  CalendarClock,
  MessageSquare,
  CheckCircle,
  Plus,
  Trash2,
  Eye,
  EyeOff,
} from "lucide-react";

type Tab = "perfil" | "servicos" | "horarios" | "whatsapp";

const DAYS = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];

const defaultHours = DAYS.map((day, i) => ({
  day,
  open: i === 0 || i === 6 ? false : true,
  start: "09:00",
  end: "19:00",
}));

const TABS: { key: Tab; label: string; icon: React.ElementType }[] = [
  { key: "perfil", label: "Perfil do Negócio", icon: Building2 },
  { key: "servicos", label: "Serviços", icon: Scissors },
  { key: "horarios", label: "Horários", icon: CalendarClock },
  { key: "whatsapp", label: "WhatsApp Business", icon: MessageSquare },
];

const CATEGORIES = [
  "Cabeleireira", "Unhas / Manicure", "Sobrancelhas", "Estética",
  "Spa", "Barbearia", "Nutricionista", "Fisioterapeuta",
  "Psicólogo", "Personal Trainer", "Fotógrafo", "Tatuador", "Outro",
];

export default function ConfiguracoesPage() {
  const [tab, setTab] = useState<Tab>("perfil");
  const [showToken, setShowToken] = useState(false);
  const [saved, setSaved] = useState(false);
  const [hours, setHours] = useState(defaultHours);

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

  const toggleDay = (i: number) => {
    setHours((prev) => prev.map((h, idx) => idx === i ? { ...h, open: !h.open } : h));
  };

  const updateHour = (i: number, field: "start" | "end", val: string) => {
    setHours((prev) => prev.map((h, idx) => idx === i ? { ...h, [field]: val } : h));
  };

  const removeService = (id: string) => {
    setServices((prev) => prev.filter((s) => s.id !== id));
  };

  const toggleService = (id: string) => {
    setServices((prev) => prev.map((s) => s.id === id ? { ...s, active: !s.active } : s));
  };

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
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Nome do negócio" defaultValue="Cabeleireira Lisboa" />
                  <Field label="Slug (URL pública)" defaultValue="cabeleireira-lisboa" prefix="vagasia.pt/book/" />
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-slate-400 mb-1.5">Categoria</label>
                    <select className="w-full rounded-lg border border-white/10 bg-[#0F172A] px-3 py-2.5 text-sm text-white outline-none focus:border-[#00B4D8]/50">
                      {CATEGORIES.map((c) => (
                        <option key={c}>{c}</option>
                      ))}
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
                    <Plus size={13} />
                    Adicionar serviço
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
                          s.active
                            ? "bg-[#2DD4BF]/15 text-[#2DD4BF]"
                            : "bg-white/5 text-slate-500"
                        }`}
                      >
                        {s.active ? "Ativo" : "Inativo"}
                      </button>
                      <button
                        onClick={() => removeService(s.id)}
                        className="shrink-0 text-slate-600 hover:text-red-400 transition-colors"
                      >
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
                <h2 className="text-sm font-semibold text-white">Horários de Funcionamento</h2>
                <div className="space-y-2">
                  {hours.map((h, i) => (
                    <div key={h.day} className="flex items-center gap-4 rounded-lg bg-[#0F172A] px-4 py-3">
                      <button
                        onClick={() => toggleDay(i)}
                        className={`relative flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
                          h.open ? "bg-[#00B4D8]" : "bg-white/10"
                        }`}
                      >
                        <span
                          className={`absolute h-3.5 w-3.5 rounded-full bg-white transition-transform ${
                            h.open ? "translate-x-4" : "translate-x-1"
                          }`}
                        />
                      </button>
                      <p className="w-32 text-sm text-slate-300">{h.day}</p>
                      {h.open ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="time"
                            value={h.start}
                            onChange={(e) => updateHour(i, "start", e.target.value)}
                            className="rounded border border-white/10 bg-[#1E293B] px-2 py-1 text-xs text-white outline-none"
                          />
                          <span className="text-slate-600 text-xs">até</span>
                          <input
                            type="time"
                            value={h.end}
                            onChange={(e) => updateHour(i, "end", e.target.value)}
                            className="rounded border border-white/10 bg-[#1E293B] px-2 py-1 text-xs text-white outline-none"
                          />
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
                    <label className="block text-xs font-medium text-slate-400 mb-1.5">
                      Phone Number ID
                    </label>
                    <input
                      placeholder="Ex: 123456789012345"
                      className="w-full rounded-lg border border-white/10 bg-[#0F172A] px-3 py-2.5 text-sm text-white placeholder-slate-700 outline-none focus:border-[#00B4D8]/50 transition-colors font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5">
                      Access Token
                    </label>
                    <div className="relative">
                      <input
                        type={showToken ? "text" : "password"}
                        placeholder="EAAxxxxxxxxxxxxxx…"
                        className="w-full rounded-lg border border-white/10 bg-[#0F172A] px-3 py-2.5 pr-10 text-sm text-white placeholder-slate-700 outline-none focus:border-[#00B4D8]/50 transition-colors font-mono"
                      />
                      <button
                        onClick={() => setShowToken(!showToken)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                      >
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
          <span className="flex items-center px-3 text-xs text-slate-600 bg-white/5 border-r border-white/10 whitespace-nowrap">
            {prefix}
          </span>
          <input
            defaultValue={defaultValue}
            className="flex-1 px-3 py-2.5 text-sm text-white bg-transparent outline-none"
          />
        </div>
      ) : (
        <input
          defaultValue={defaultValue}
          className="w-full rounded-lg border border-white/10 bg-[#0F172A] px-3 py-2.5 text-sm text-white outline-none focus:border-[#00B4D8]/50 transition-colors"
        />
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
          saved
            ? "bg-[#2DD4BF]/20 text-[#2DD4BF]"
            : "bg-[#00B4D8] text-white hover:bg-[#0090b0]"
        }`}
      >
        {saved && <CheckCircle size={15} />}
        {saved ? "Guardado!" : "Guardar alterações"}
      </button>
    </div>
  );
}
