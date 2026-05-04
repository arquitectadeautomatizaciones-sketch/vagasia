import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import {
  CalendarCheck,
  Banknote,
  TrendingUp,
  CheckCircle,
  Clock,
  XCircle,
  Star,
  Award,
  Cake,
  Gift,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";

/* ─── Demo data ─── */

const TODAY = new Date();
const todayStr = TODAY.toLocaleDateString("pt-PT", {
  weekday: "long", day: "numeric", month: "long", year: "numeric",
});

const APPOINTMENTS = [
  { time: "09:00", end: "09:45", client: "Ana Ferreira",       service: "Corte & Brushing",      price: 35, status: "confirmada" },
  { time: "10:00", end: "12:00", client: "Mariana Costa",      service: "Coloração",              price: 65, status: "confirmada" },
  { time: "12:00", end: "13:00", client: "Rita Fonseca",        service: "Manicure + Pedicure",    price: 45, status: "confirmada" },
  { time: "14:00", end: "15:00", client: "Beatriz Oliveira",    service: "Tratamento Capilar",     price: 42, status: "confirmada" },
  { time: "15:30", end: "16:15", client: "Inês Santos",         service: "Corte de Cabelo",        price: 28, status: "confirmada" },
  { time: "16:30", end: "18:30", client: "Catarina Lima",       service: "Coloração + Mèche",      price: 90, status: "confirmada" },
  { time: "17:00", end: "17:45", client: "Sofia Rodrigues",     service: "Escova",                 price: 25, status: "pendente"   },
  { time: "18:30", end: "19:15", client: "Joana Pereira",       service: "Manicure",               price: 22, status: "pendente"   },
];

const confirmed = APPOINTMENTS.filter((a) => a.status === "confirmada");
const revenue = confirmed.reduce((s, a) => s + a.price, 0);
const rate = Math.round((confirmed.length / APPOINTMENTS.length) * 100);

const CLIENTS = [
  { name: "Mariana Costa",   appointments: 24, spent: 1240, initial: "M" },
  { name: "Ana Ferreira",    appointments: 18, spent: 630,  initial: "A" },
  { name: "Beatriz Oliveira",appointments: 15, spent: 480,  initial: "B" },
  { name: "Rita Fonseca",    appointments: 12, spent: 390,  initial: "R" },
];

const LOYALTY = [
  { name: "Mariana Costa",  stamps: 8,  goal: 10, reward: "1 coloração grátis",  completed: false, initial: "M" },
  { name: "Ana Ferreira",   stamps: 10, goal: 10, reward: "Corte grátis",         completed: true,  initial: "A" },
];

const BIRTHDAYS_TODAY   = [{ name: "Rita Fonseca",     phone: "+351 936 111 222" }];
const BIRTHDAYS_SEMANA  = [
  { name: "Sofia Rodrigues", dias: 2 },
  { name: "Inês Santos",     dias: 5 },
];

const SATISFACTION = { qualidade: 4.8, espera: 4.3, simpatia: 4.9, total: 47 };

/* ─── Helpers ─── */

function statusColors(s: string) {
  if (s === "confirmada") return "bg-[#2DD4BF]/15 text-[#2DD4BF]";
  if (s === "pendente")   return "bg-yellow-500/15 text-yellow-400";
  return "bg-red-500/15 text-red-400";
}
function StatusIcon({ s }: { s: string }) {
  if (s === "confirmada") return <CheckCircle size={12} />;
  if (s === "pendente")   return <Clock size={12} />;
  return <XCircle size={12} />;
}

function KpiCard({ label, value, sub, icon: Icon, accent }: {
  label: string; value: string; sub: string; icon: React.ElementType; accent: string;
}) {
  return (
    <div className="rounded-xl border border-white/5 bg-[#1E293B] p-5">
      <div className="flex items-start justify-between">
        <p className="text-xs text-slate-400 font-medium">{label}</p>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ backgroundColor: accent + "22" }}>
          <Icon size={16} style={{ color: accent }} />
        </div>
      </div>
      <p className="mt-3 text-2xl font-bold text-white">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{sub}</p>
    </div>
  );
}

function ScoreBar({ value }: { value: number }) {
  const color = value >= 4.5 ? "#2DD4BF" : value >= 3.5 ? "#00B4D8" : "#f87171";
  return (
    <div className="h-1.5 rounded-full bg-white/5 w-full overflow-hidden">
      <div className="h-full rounded-full" style={{ width: `${(value / 5) * 100}%`, backgroundColor: color }} />
    </div>
  );
}

/* ─── Page ─── */

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-[#0F172A]">
      {/* Demo banner */}
      <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between gap-4 bg-[#00B4D8] px-5 py-2.5">
        <p className="text-sm font-medium text-white">
          Estás a ver uma demonstração do VagasIA.
        </p>
        <Link
          href="/register"
          className="flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-[#00B4D8] hover:bg-[#e0f7ff] transition-colors shrink-0"
        >
          Cria a tua conta grátis <ArrowRight size={12} />
        </Link>
      </div>

      {/* Layout: sidebar + content */}
      <div className="flex h-screen pt-[44px]">
        <div className="shrink-0">
          <Sidebar demoBusinessName="Salão Demo VagasIA" demoLogoInitials="SD" />
        </div>

        <main className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">

            {/* Header */}
            <div>
              <h1 className="text-xl font-semibold text-white">Dashboard</h1>
              <p className="text-sm text-slate-400 mt-0.5 capitalize">{todayStr}</p>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <KpiCard label="Marcações Hoje"     value={String(APPOINTMENTS.length)} sub={`${confirmed.length} confirmadas · ${APPOINTMENTS.length - confirmed.length} pendentes`} icon={CalendarCheck} accent="#00B4D8" />
              <KpiCard label="Faturação do Dia"   value={`€${revenue}`}               sub={`${confirmed.length} serviços realizados`}                                                  icon={Banknote}     accent="#2DD4BF" />
              <KpiCard label="Vagas Recuperadas"  value={String(confirmed.length)}     sub="Confirmadas hoje"                                                                          icon={TrendingUp}   accent="#00B4D8" />
              <KpiCard label="Taxa de Confirmação" value={`${rate}%`}                  sub="Marcações de hoje"                                                                         icon={CheckCircle}  accent="#2DD4BF" />
            </div>

            {/* Agenda de Hoje */}
            <div className="rounded-xl border border-white/5 bg-[#1E293B]">
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
                <h2 className="text-sm font-semibold text-white">Agenda de Hoje</h2>
                <span className="text-xs text-slate-500">{APPOINTMENTS.length} marcações</span>
              </div>
              <div className="divide-y divide-white/5">
                {APPOINTMENTS.map((a, i) => (
                  <div key={i} className="flex items-center gap-4 px-5 py-3.5">
                    <div className="w-16 text-center shrink-0">
                      <p className="text-xs font-medium text-slate-300">{a.time}</p>
                      <p className="text-[10px] text-slate-600">{a.end}</p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{a.client}</p>
                      <p className="text-xs text-slate-500 truncate">{a.service}</p>
                    </div>
                    <p className="text-sm font-semibold text-slate-300 shrink-0">€{a.price}</p>
                    <span className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium shrink-0 ${statusColors(a.status)}`}>
                      <StatusIcon s={a.status} />
                      {a.status === "confirmada" ? "Confirmada" : "Pendente"}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* 3-col grid: Clientes · Fidelização · Aniversários */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">

              {/* Clientes */}
              <div className="rounded-xl border border-white/5 bg-[#1E293B]">
                <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
                  <h2 className="text-sm font-semibold text-white">Top Clientes</h2>
                  <span className="text-xs text-slate-500">{CLIENTS.length} em destaque</span>
                </div>
                <div className="divide-y divide-white/5">
                  {CLIENTS.map((c) => (
                    <div key={c.name} className="flex items-center gap-3 px-5 py-3.5">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#00B4D8]/20 text-xs font-semibold text-[#00B4D8]">
                        {c.initial}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{c.name}</p>
                        <p className="text-[11px] text-slate-500">{c.appointments} marcações</p>
                      </div>
                      <p className="text-sm font-semibold text-[#2DD4BF] shrink-0">€{c.spent}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Fidelização */}
              <div className="rounded-xl border border-white/5 bg-[#1E293B]">
                <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
                  <h2 className="text-sm font-semibold text-white">Fidelização</h2>
                  <Award size={14} className="text-slate-500" />
                </div>
                <div className="p-4 space-y-4">
                  {LOYALTY.map((card) => (
                    <div key={card.name} className={`rounded-lg border p-4 space-y-3 ${card.completed ? "border-[#2DD4BF]/30" : "border-white/5"}`}>
                      <div className="flex items-center gap-3">
                        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${card.completed ? "bg-[#2DD4BF]/20 text-[#2DD4BF]" : "bg-[#00B4D8]/20 text-[#00B4D8]"}`}>
                          {card.initial}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">{card.name}</p>
                          {card.completed && (
                            <div className="flex items-center gap-1">
                              <CheckCircle2 size={10} className="text-[#2DD4BF]" />
                              <span className="text-[10px] text-[#2DD4BF] font-semibold">Completo!</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {Array.from({ length: card.goal }).map((_, i) => (
                          <div key={i} className={`h-6 w-6 rounded-full border-2 ${i < card.stamps ? (card.completed ? "border-[#2DD4BF] bg-[#2DD4BF]" : "border-[#00B4D8] bg-[#00B4D8]") : "border-slate-600"}`} />
                        ))}
                      </div>
                      <div className="flex items-center justify-between">
                        <p className={`text-xs ${card.completed ? "text-[#2DD4BF]" : "text-slate-400"}`}>{card.stamps}/{card.goal} carimbos</p>
                        <div className="flex items-center gap-1 text-[11px] text-slate-500">
                          <Gift size={10} />{card.reward}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Aniversários + Satisfação */}
              <div className="space-y-4">
                {/* Aniversários */}
                <div className="rounded-xl border border-white/5 bg-[#1E293B]">
                  <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
                    <h2 className="text-sm font-semibold text-white">Aniversários</h2>
                    <Cake size={14} className="text-slate-500" />
                  </div>
                  <div className="p-4 space-y-2">
                    {BIRTHDAYS_TODAY.map((b) => (
                      <div key={b.name} className="flex items-center gap-3 rounded-lg bg-[#2DD4BF]/10 border border-[#2DD4BF]/20 px-3 py-2.5">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#2DD4BF]/20 text-[11px] font-bold text-[#2DD4BF]">{b.name[0]}</div>
                        <div>
                          <p className="text-sm font-medium text-white">{b.name}</p>
                          <div className="flex items-center gap-1">
                            <Cake size={10} className="text-[#2DD4BF]" />
                            <span className="text-[10px] text-[#2DD4BF] font-semibold">Hoje!</span>
                          </div>
                        </div>
                      </div>
                    ))}
                    {BIRTHDAYS_SEMANA.map((b) => (
                      <div key={b.name} className="flex items-center gap-3 rounded-lg bg-[#0F172A] px-3 py-2.5">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#00B4D8]/15 text-[11px] font-bold text-[#00B4D8]">{b.name[0]}</div>
                        <p className="flex-1 text-sm text-white">{b.name}</p>
                        <p className="text-[11px] text-[#00B4D8] font-medium shrink-0">em {b.dias}d</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Satisfação */}
                <div className="rounded-xl border border-white/5 bg-[#1E293B]">
                  <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
                    <h2 className="text-sm font-semibold text-white">Satisfação</h2>
                    <div className="flex items-center gap-1 text-[11px] text-slate-500">
                      <Star size={11} fill="#00B4D8" className="text-[#00B4D8]" />
                      {SATISFACTION.total} avaliações
                    </div>
                  </div>
                  <div className="p-4 space-y-3">
                    {[
                      { label: "Qualidade", value: SATISFACTION.qualidade },
                      { label: "Tempo espera", value: SATISFACTION.espera },
                      { label: "Simpatia", value: SATISFACTION.simpatia },
                    ].map((k) => (
                      <div key={k.label} className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-slate-400">{k.label}</p>
                          <div className="flex items-center gap-1">
                            <Star size={10} fill="#2DD4BF" className="text-[#2DD4BF]" />
                            <p className="text-xs font-semibold text-white">{k.value}</p>
                          </div>
                        </div>
                        <ScoreBar value={k.value} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom CTA */}
            <div className="rounded-xl border border-[#00B4D8]/20 bg-[#00B4D8]/5 px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <p className="text-base font-semibold text-white">Pronta para começar?</p>
                <p className="text-sm text-slate-400 mt-0.5">Cria a tua conta grátis e começa a gerir o teu negócio hoje.</p>
              </div>
              <Link
                href="/register"
                className="flex items-center gap-2 rounded-xl bg-[#00B4D8] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#0090b0] transition-colors shrink-0"
              >
                Criar conta grátis <ArrowRight size={15} />
              </Link>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}
