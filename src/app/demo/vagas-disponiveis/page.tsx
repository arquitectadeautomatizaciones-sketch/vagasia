import { CalendarCheck, Clock, Scissors, EyeOff, Users } from "lucide-react";

const VAGAS = [
  { id: 1, data: "Amanhã · 7 Mai", hora: "09:00", duracao: 45,  servico: "Corte de Cabelo",    inscritos: 3, publicada: true  },
  { id: 2, data: "Amanhã · 7 Mai", hora: "14:30", duracao: 60,  servico: "Manicure + Pedicure", inscritos: 5, publicada: true  },
  { id: 3, data: "8 Mai",          hora: "10:00", duracao: 120, servico: "Coloração",            inscritos: 7, publicada: true  },
  { id: 4, data: "8 Mai",          hora: "16:00", duracao: 45,  servico: "Escova",               inscritos: 2, publicada: true  },
  { id: 5, data: "9 Mai",          hora: "11:30", duracao: 90,  servico: "Mèches Completas",    inscritos: 4, publicada: true  },
  { id: 6, data: "9 Mai",          hora: "15:00", duracao: 30,  servico: "Pedicure",              inscritos: 1, publicada: true  },
  { id: 7, data: "10 Mai",         hora: "09:30", duracao: 60,  servico: "Tratamento Capilar",  inscritos: 6, publicada: true  },
  { id: 8, data: "12 Mai",         hora: "10:00", duracao: 45,  servico: "Corte & Brushing",    inscritos: 8, publicada: true  },
];

export default function DemoVagasDisponiveisPage() {
  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">Vagas Disponíveis</h1>
          <p className="text-sm text-slate-400 mt-0.5">{VAGAS.length} vagas publicadas</p>
        </div>
        <button className="flex items-center gap-2 rounded-xl bg-[#00B4D8] px-4 py-2 text-sm font-medium text-white hover:bg-[#0090b0] transition-colors">
          <CalendarCheck size={15} />
          Publicar nova vaga
        </button>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-white/5 bg-[#1E293B] px-4 py-3">
          <p className="text-xs text-slate-500">Vagas publicadas</p>
          <p className="text-2xl font-bold text-white mt-1">{VAGAS.length}</p>
        </div>
        <div className="rounded-xl border border-white/5 bg-[#1E293B] px-4 py-3">
          <p className="text-xs text-slate-500">Interessadas no total</p>
          <p className="text-2xl font-bold text-[#00B4D8] mt-1">{VAGAS.reduce((s, v) => s + v.inscritos, 0)}</p>
        </div>
        <div className="rounded-xl border border-white/5 bg-[#1E293B] px-4 py-3">
          <p className="text-xs text-slate-500">Média de interessadas</p>
          <p className="text-2xl font-bold text-[#2DD4BF] mt-1">
            {(VAGAS.reduce((s, v) => s + v.inscritos, 0) / VAGAS.length).toFixed(1)}
          </p>
        </div>
      </div>

      {/* Vagas grid */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {VAGAS.map((v) => (
          <div key={v.id} className="rounded-xl border border-white/5 bg-[#1E293B] p-5 space-y-4">
            {/* Top: date + badge */}
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-[#00B4D8]">{v.data}</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <Clock size={12} className="text-slate-500" />
                  <p className="text-base font-bold text-white">{v.hora}</p>
                  <span className="text-xs text-slate-500">· {v.duracao} min</span>
                </div>
              </div>
              <span className="flex items-center gap-1 rounded-full bg-[#2DD4BF]/15 px-2.5 py-1 text-[11px] font-semibold text-[#2DD4BF]">
                <CalendarCheck size={10} />
                Publicada
              </span>
            </div>

            {/* Service */}
            <div className="flex items-center gap-2">
              <Scissors size={13} className="text-slate-500 shrink-0" />
              <p className="text-sm text-slate-300">{v.servico}</p>
            </div>

            {/* Interested */}
            <div className="flex items-center justify-between rounded-lg bg-white/[0.04] px-3 py-2">
              <div className="flex items-center gap-1.5">
                <Users size={13} className="text-slate-400" />
                <span className="text-xs text-slate-400">Interessadas</span>
              </div>
              <span className={`text-sm font-bold ${v.inscritos >= 5 ? "text-[#2DD4BF]" : "text-slate-200"}`}>
                {v.inscritos}
              </span>
            </div>

            {/* Action */}
            <button className="flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 py-2 text-xs font-medium text-slate-400 hover:border-white/20 hover:text-white transition-colors">
              <EyeOff size={13} />
              Despublicar
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
