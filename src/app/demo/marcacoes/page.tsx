import { CheckCircle, Clock, XCircle } from "lucide-react";

const APPOINTMENTS = [
  { date: "06 Mai", time: "09:00", end: "09:45", client: "Ana Ferreira",       service: "Corte & Brushing",   price: 35,  status: "confirmada", duration: 45  },
  { date: "06 Mai", time: "10:00", end: "12:00", client: "Mariana Costa",      service: "Coloração",           price: 65,  status: "confirmada", duration: 120 },
  { date: "06 Mai", time: "12:00", end: "13:00", client: "Rita Fonseca",       service: "Manicure + Pedicure", price: 45,  status: "confirmada", duration: 60  },
  { date: "06 Mai", time: "14:00", end: "15:00", client: "Beatriz Oliveira",   service: "Tratamento Capilar",  price: 42,  status: "confirmada", duration: 60  },
  { date: "06 Mai", time: "15:30", end: "16:15", client: "Inês Santos",        service: "Corte de Cabelo",     price: 28,  status: "confirmada", duration: 45  },
  { date: "06 Mai", time: "16:30", end: "18:30", client: "Catarina Lima",      service: "Coloração + Mèche",   price: 90,  status: "confirmada", duration: 120 },
  { date: "06 Mai", time: "17:00", end: "17:45", client: "Sofia Rodrigues",    service: "Escova",               price: 25,  status: "pendente",   duration: 45  },
  { date: "06 Mai", time: "18:30", end: "19:15", client: "Joana Pereira",      service: "Manicure",             price: 22,  status: "pendente",   duration: 45  },
  { date: "07 Mai", time: "09:30", end: "10:15", client: "Leonor Carvalho",    service: "Corte de Cabelo",     price: 28,  status: "confirmada", duration: 45  },
  { date: "07 Mai", time: "10:30", end: "12:30", client: "Filipa Matos",       service: "Coloração + Hidra.",  price: 85,  status: "confirmada", duration: 120 },
  { date: "07 Mai", time: "11:00", end: "12:00", client: "Daniela Sousa",      service: "Manicure Gel",         price: 32,  status: "confirmada", duration: 60  },
  { date: "07 Mai", time: "14:00", end: "14:30", client: "Marta Pinheiro",     service: "Escova Progressiva",   price: 120, status: "confirmada", duration: 30  },
  { date: "07 Mai", time: "15:00", end: "15:45", client: "Raquel Teixeira",    service: "Corte & Brushing",    price: 35,  status: "pendente",   duration: 45  },
  { date: "07 Mai", time: "16:00", end: "18:00", client: "Cristina Neves",     service: "Mèches",               price: 75,  status: "cancelada",  duration: 120 },
  { date: "08 Mai", time: "09:00", end: "09:30", client: "Paula Gonçalves",    service: "Pedicure",              price: 28,  status: "confirmada", duration: 30  },
  { date: "08 Mai", time: "10:00", end: "12:00", client: "Ana Ferreira",       service: "Coloração",            price: 65,  status: "confirmada", duration: 120 },
  { date: "08 Mai", time: "13:00", end: "14:00", client: "Susana Lopes",       service: "Tratamento Capilar",   price: 42,  status: "pendente",   duration: 60  },
  { date: "08 Mai", time: "15:00", end: "15:45", client: "Mariana Costa",      service: "Escova",               price: 25,  status: "cancelada",  duration: 45  },
  { date: "08 Mai", time: "16:30", end: "17:30", client: "Teresa Almeida",     service: "Manicure + Pedicure", price: 45,  status: "confirmada", duration: 60  },
  { date: "09 Mai", time: "09:00", end: "11:00", client: "Beatriz Oliveira",   service: "Coloração Total",      price: 70,  status: "confirmada", duration: 120 },
  { date: "09 Mai", time: "11:30", end: "12:15", client: "Inês Santos",        service: "Corte de Cabelo",      price: 28,  status: "confirmada", duration: 45  },
  { date: "09 Mai", time: "14:00", end: "15:30", client: "Catarina Lima",      service: "Pestanas c/ Volume",   price: 55,  status: "pendente",   duration: 90  },
];

const STATUS_MAP: Record<string, { label: string; bg: string; text: string; icon: React.ElementType }> = {
  confirmada: { label: "Confirmada", bg: "bg-[#2DD4BF]/15", text: "text-[#2DD4BF]", icon: CheckCircle },
  pendente:   { label: "Pendente",   bg: "bg-yellow-500/15", text: "text-yellow-400", icon: Clock },
  cancelada:  { label: "Cancelada",  bg: "bg-red-500/15",    text: "text-red-400",    icon: XCircle },
};

const confirmadas = APPOINTMENTS.filter((a) => a.status === "confirmada");
const pendentes   = APPOINTMENTS.filter((a) => a.status === "pendente");
const canceladas  = APPOINTMENTS.filter((a) => a.status === "cancelada");
const total       = confirmadas.reduce((s, a) => s + a.price, 0);

const byDate = APPOINTMENTS.reduce<Record<string, typeof APPOINTMENTS>>((acc, a) => {
  (acc[a.date] ??= []).push(a);
  return acc;
}, {});

export default function DemoMarcacoesPage() {
  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">Marcações</h1>
          <p className="text-sm text-slate-400 mt-0.5">Gerir todos os agendamentos</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-white/10 bg-[#1E293B] p-0.5">
            {["dia", "semana", "mês"].map((v, i) => (
              <button key={v} className={`rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-colors ${i === 1 ? "bg-[#00B4D8] text-white" : "text-slate-400"}`}>
                {v}
              </button>
            ))}
          </div>
          <div className="flex rounded-lg border border-white/10 bg-[#1E293B] p-0.5">
            {["Todas", "Confirmadas", "Pendentes", "Canceladas"].map((f, i) => (
              <button key={f} className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${i === 0 ? "bg-white/10 text-white" : "text-slate-400"}`}>
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Total", value: APPOINTMENTS.length, color: "text-white" },
          { label: "Confirmadas", value: confirmadas.length, color: "text-[#2DD4BF]" },
          { label: "Pendentes",   value: pendentes.length,   color: "text-yellow-400" },
          { label: "Canceladas",  value: canceladas.length,  color: "text-red-400" },
        ].map((k) => (
          <div key={k.label} className="rounded-xl border border-white/5 bg-[#1E293B] px-4 py-3">
            <p className="text-xs text-slate-500">{k.label}</p>
            <p className={`text-2xl font-bold mt-1 ${k.color}`}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Appointments grouped by date */}
      <div className="space-y-4">
        {Object.entries(byDate).map(([date, appts]) => (
          <div key={date} className="rounded-xl border border-white/5 bg-[#1E293B] overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/5 bg-white/[0.02]">
              <p className="text-xs font-semibold text-slate-300">{date}</p>
              <span className="text-[11px] text-slate-500">{appts.length} marcações · €{appts.filter(a => a.status === "confirmada").reduce((s, a) => s + a.price, 0)}</span>
            </div>
            <div className="divide-y divide-white/5">
              {appts.map((a, i) => {
                const cfg = STATUS_MAP[a.status];
                const Icon = cfg.icon;
                return (
                  <div key={i} className="flex items-center gap-4 px-5 py-3.5 hover:bg-white/[0.02] transition-colors">
                    <div className="w-14 shrink-0 text-center">
                      <p className="text-xs font-semibold text-white">{a.time}</p>
                      <div className="my-1 mx-auto h-5 w-px bg-white/10" />
                      <p className="text-[10px] text-slate-600">{a.end}</p>
                    </div>
                    <div className="w-1 self-stretch rounded-full bg-[#00B4D8]/40 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white">{a.client}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{a.service} · {a.duration} min</p>
                    </div>
                    <p className="text-sm font-semibold text-[#2DD4BF] shrink-0">€{a.price}</p>
                    <span className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-medium shrink-0 ${cfg.bg} ${cfg.text}`}>
                      <Icon size={11} />
                      {cfg.label}
                    </span>
                    {a.status === "pendente" && (
                      <div className="flex items-center gap-1 ml-1 shrink-0">
                        <button className="rounded-lg px-2.5 py-1.5 text-[11px] font-medium bg-[#2DD4BF]/10 text-[#2DD4BF]">Confirmar</button>
                        <button className="rounded-lg px-2.5 py-1.5 text-[11px] font-medium bg-red-500/10 text-red-400">Cancelar</button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Footer summary */}
      <div className="flex gap-4 text-xs text-slate-500">
        <span>{confirmadas.length} confirmadas</span>
        <span>{pendentes.length} pendentes</span>
        <span>{canceladas.length} canceladas</span>
        <span className="ml-auto text-slate-300 font-medium">Faturação confirmada: €{total}</span>
      </div>
    </div>
  );
}
