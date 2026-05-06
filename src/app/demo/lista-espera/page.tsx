import { Clock, CalendarDays, Scissors } from "lucide-react";

const WAITING = [
  { pos: 1,  name: "Vera Monteiro",     phone: "+351 917 234 567", servico: "Coloração",           preferencia: "Manhã",  diasEspera: 1,  added: "05 Mai 2026", initial: "V" },
  { pos: 2,  name: "Cláudia Borges",    phone: "+351 932 345 678", servico: "Mèches Completas",    preferencia: "Tarde",  diasEspera: 2,  added: "04 Mai 2026", initial: "C" },
  { pos: 3,  name: "Patrícia Soares",   phone: "+351 963 456 789", servico: "Corte & Brushing",    preferencia: "Manhã",  diasEspera: 3,  added: "03 Mai 2026", initial: "P" },
  { pos: 4,  name: "Andreia Ferreira",  phone: "+351 914 567 890", servico: "Pestanas Volume",     preferencia: "Qualquer", diasEspera: 4, added: "02 Mai 2026", initial: "A" },
  { pos: 5,  name: "Natália Pires",     phone: "+351 936 678 901", servico: "Escova Progressiva",  preferencia: "Tarde",  diasEspera: 5,  added: "01 Mai 2026", initial: "N" },
  { pos: 6,  name: "Carla Mendonça",    phone: "+351 965 789 012", servico: "Manicure Gel",         preferencia: "Manhã",  diasEspera: 7,  added: "29 Abr 2026", initial: "C" },
  { pos: 7,  name: "Lúcia Rodrigues",   phone: "+351 919 890 123", servico: "Tratamento Capilar",  preferencia: "Qualquer", diasEspera: 8, added: "28 Abr 2026", initial: "L" },
  { pos: 8,  name: "Graça Figueiredo",  phone: "+351 943 901 234", servico: "Coloração + Mèche",   preferencia: "Tarde",  diasEspera: 10, added: "26 Abr 2026", initial: "G" },
  { pos: 9,  name: "Sónia Tavares",     phone: "+351 968 012 345", servico: "Corte de Cabelo",     preferencia: "Manhã",  diasEspera: 11, added: "25 Abr 2026", initial: "S" },
  { pos: 10, name: "Isabel Ferraz",     phone: "+351 912 123 456", servico: "Hidratação Profunda", preferencia: "Qualquer", diasEspera: 14, added: "22 Abr 2026", initial: "I" },
];

function urgencyColor(dias: number) {
  if (dias <= 3)  return "text-[#2DD4BF] bg-[#2DD4BF]/10";
  if (dias <= 7)  return "text-yellow-400 bg-yellow-500/10";
  return "text-red-400 bg-red-500/10";
}

export default function DemoListaEsperaPage() {
  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">Lista de Espera</h1>
          <p className="text-sm text-slate-400 mt-0.5">{WAITING.length} clientes aguardam disponibilidade</p>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-white/5 bg-[#1E293B] px-4 py-3">
          <p className="text-xs text-slate-500">Na lista de espera</p>
          <p className="text-2xl font-bold text-white mt-1">{WAITING.length}</p>
        </div>
        <div className="rounded-xl border border-white/5 bg-[#1E293B] px-4 py-3">
          <p className="text-xs text-slate-500">Espera média</p>
          <p className="text-2xl font-bold text-yellow-400 mt-1">
            {Math.round(WAITING.reduce((s, w) => s + w.diasEspera, 0) / WAITING.length)} dias
          </p>
        </div>
        <div className="rounded-xl border border-white/5 bg-[#1E293B] px-4 py-3">
          <p className="text-xs text-slate-500">Aguardam há mais de 7 dias</p>
          <p className="text-2xl font-bold text-red-400 mt-1">{WAITING.filter(w => w.diasEspera > 7).length}</p>
        </div>
      </div>

      {/* Waiting list */}
      <div className="rounded-xl border border-white/5 bg-[#1E293B] overflow-hidden">
        <div className="grid grid-cols-[auto_1fr_auto_auto_auto_auto] items-center gap-4 px-5 py-3 border-b border-white/5 bg-white/[0.02]">
          <p className="text-xs font-medium text-slate-500 w-6">#</p>
          <p className="text-xs font-medium text-slate-500">Cliente</p>
          <p className="text-xs font-medium text-slate-500 w-40">Serviço</p>
          <p className="text-xs font-medium text-slate-500 w-24">Preferência</p>
          <p className="text-xs font-medium text-slate-500 w-24 text-center">Na espera</p>
          <p className="text-xs font-medium text-slate-500 w-28 text-right">Adicionado</p>
        </div>
        <div className="divide-y divide-white/5">
          {WAITING.map((w) => (
            <div key={w.pos} className="grid grid-cols-[auto_1fr_auto_auto_auto_auto] items-center gap-4 px-5 py-3.5 hover:bg-white/[0.02] transition-colors">
              {/* Position */}
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/5 text-[11px] font-semibold text-slate-400">
                {w.pos}
              </div>
              {/* Client */}
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#00B4D8]/15 text-xs font-bold text-[#00B4D8]">
                  {w.initial}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white truncate">{w.name}</p>
                  <p className="text-[11px] text-slate-500">{w.phone}</p>
                </div>
              </div>
              {/* Service */}
              <div className="flex items-center gap-1.5 w-40">
                <Scissors size={11} className="text-slate-600 shrink-0" />
                <span className="text-xs text-slate-300 truncate">{w.servico}</span>
              </div>
              {/* Preference */}
              <div className="flex items-center gap-1 w-24">
                <CalendarDays size={11} className="text-slate-600" />
                <span className="text-xs text-slate-400">{w.preferencia}</span>
              </div>
              {/* Days waiting */}
              <div className="flex justify-center w-24">
                <span className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium ${urgencyColor(w.diasEspera)}`}>
                  <Clock size={10} />
                  {w.diasEspera}d
                </span>
              </div>
              {/* Added */}
              <p className="text-[11px] text-slate-500 w-28 text-right">{w.added}</p>
            </div>
          ))}
        </div>
      </div>

      <p className="text-xs text-slate-600">
        Quando uma vaga for publicada, os clientes em lista de espera são notificados automaticamente por WhatsApp.
      </p>
    </div>
  );
}
