import { Award, Gift, CheckCircle2 } from "lucide-react";

const CARDS = [
  { name: "Ana Ferreira",     initial: "A", stamps: 10, goal: 10, reward: "Corte grátis",          completed: true  },
  { name: "Mariana Costa",    initial: "M", stamps: 8,  goal: 10, reward: "1 coloração grátis",    completed: false },
  { name: "Beatriz Oliveira", initial: "B", stamps: 6,  goal: 10, reward: "Manicure + Pedicure",   completed: false },
  { name: "Catarina Lima",    initial: "C", stamps: 10, goal: 10, reward: "Escova grátis",          completed: true  },
  { name: "Sofia Rodrigues",  initial: "S", stamps: 3,  goal: 10, reward: "Corte grátis",          completed: false },
  { name: "Rita Fonseca",     initial: "R", stamps: 9,  goal: 10, reward: "Hidratação grátis",     completed: false },
  { name: "Inês Santos",      initial: "I", stamps: 5,  goal: 10, reward: "Manicure grátis",       completed: false },
  { name: "Joana Pereira",    initial: "J", stamps: 10, goal: 10, reward: "Tratamento capilar",    completed: true  },
  { name: "Leonor Carvalho",  initial: "L", stamps: 2,  goal: 10, reward: "Corte grátis",          completed: false },
  { name: "Filipa Matos",     initial: "F", stamps: 7,  goal: 10, reward: "Coloração grátis",      completed: false },
  { name: "Daniela Sousa",    initial: "D", stamps: 4,  goal: 10, reward: "Manicure gel grátis",   completed: false },
  { name: "Marta Pinheiro",   initial: "M", stamps: 10, goal: 10, reward: "Escova progressiva 50%",completed: true  },
];

const completed = CARDS.filter((c) => c.completed);
const active    = CARDS.filter((c) => !c.completed);

export default function DemoFidelizacaoPage() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-white">Fidelização</h1>
        <p className="text-sm text-slate-400 mt-0.5">{CARDS.length} cartões activos</p>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-white/5 bg-[#1E293B] px-4 py-3">
          <p className="text-xs text-slate-500">Cartões activos</p>
          <p className="text-2xl font-bold text-white mt-1">{CARDS.length}</p>
        </div>
        <div className="rounded-xl border border-[#2DD4BF]/20 bg-[#1E293B] px-4 py-3">
          <p className="text-xs text-slate-500">Completos este mês</p>
          <p className="text-2xl font-bold text-[#2DD4BF] mt-1">{completed.length}</p>
        </div>
        <div className="rounded-xl border border-white/5 bg-[#1E293B] px-4 py-3">
          <p className="text-xs text-slate-500">Em progresso</p>
          <p className="text-2xl font-bold text-[#00B4D8] mt-1">{active.length}</p>
        </div>
      </div>

      {/* Completed cards */}
      {completed.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 size={14} className="text-[#2DD4BF]" />
            <h2 className="text-sm font-semibold text-[#2DD4BF]">Completos — a resgatar</h2>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {completed.map((card) => (
              <div key={card.name + card.reward} className="rounded-xl border border-[#2DD4BF]/30 bg-[#1E293B] p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#2DD4BF]/20 text-sm font-bold text-[#2DD4BF]">
                    {card.initial}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{card.name}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <CheckCircle2 size={10} className="text-[#2DD4BF]" />
                      <span className="text-[10px] font-semibold text-[#2DD4BF]">Completo!</span>
                    </div>
                  </div>
                  <Award size={16} className="text-[#2DD4BF] ml-auto" />
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {Array.from({ length: card.goal }).map((_, i) => (
                    <div key={i} className="h-6 w-6 rounded-full border-2 border-[#2DD4BF] bg-[#2DD4BF]" />
                  ))}
                </div>
                <div className="flex items-center justify-between rounded-lg bg-[#2DD4BF]/10 px-3 py-2">
                  <div className="flex items-center gap-1.5">
                    <Gift size={12} className="text-[#2DD4BF]" />
                    <span className="text-xs font-medium text-[#2DD4BF]">{card.reward}</span>
                  </div>
                  <button className="text-[11px] font-semibold text-white bg-[#2DD4BF] rounded-md px-2.5 py-1 hover:bg-[#22b8a4] transition-colors">
                    Resgatar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active cards */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Award size={14} className="text-slate-400" />
          <h2 className="text-sm font-semibold text-slate-300">Em progresso</h2>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {active.map((card) => {
            const pct = Math.round((card.stamps / card.goal) * 100);
            return (
              <div key={card.name + card.reward} className="rounded-xl border border-white/5 bg-[#1E293B] p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#00B4D8]/20 text-sm font-bold text-[#00B4D8]">
                    {card.initial}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{card.name}</p>
                    <p className="text-[11px] text-slate-500">{card.stamps}/{card.goal} carimbos · {pct}%</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {Array.from({ length: card.goal }).map((_, i) => (
                    <div
                      key={i}
                      className={`h-6 w-6 rounded-full border-2 ${
                        i < card.stamps ? "border-[#00B4D8] bg-[#00B4D8]" : "border-slate-700"
                      }`}
                    />
                  ))}
                </div>
                {/* Progress bar */}
                <div className="space-y-1.5">
                  <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                    <div className="h-full rounded-full bg-[#00B4D8]" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-slate-500">
                    <Gift size={10} />
                    {card.reward}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
