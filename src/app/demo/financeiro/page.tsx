import { Banknote, TrendingUp, TrendingDown, Wallet, ArrowUpRight, ArrowDownRight } from "lucide-react";

const ENTRADAS = [
  { data: "06 Mai", descricao: "Coloração — Catarina Lima",       categoria: "Serviço", valor: 90  },
  { data: "06 Mai", descricao: "Corte & Brushing — Ana Ferreira", categoria: "Serviço", valor: 35  },
  { data: "06 Mai", descricao: "Coloração — Mariana Costa",       categoria: "Serviço", valor: 65  },
  { data: "06 Mai", descricao: "Manicure + Pedicure — Rita F.",   categoria: "Serviço", valor: 45  },
  { data: "06 Mai", descricao: "Tratamento Capilar — B. Oliveira",categoria: "Serviço", valor: 42  },
  { data: "06 Mai", descricao: "Corte de Cabelo — Inês Santos",   categoria: "Serviço", valor: 28  },
  { data: "05 Mai", descricao: "Coloração — Filipa Matos",        categoria: "Serviço", valor: 85  },
  { data: "05 Mai", descricao: "Manicure Gel — Daniela Sousa",   categoria: "Serviço", valor: 32  },
  { data: "05 Mai", descricao: "Escova Progressiva — M. Pinheiro",categoria: "Serviço", valor: 120 },
  { data: "04 Mai", descricao: "Mèches — Cristina Neves",         categoria: "Serviço", valor: 75  },
  { data: "04 Mai", descricao: "Pedicure — Paula Gonçalves",      categoria: "Serviço", valor: 28  },
  { data: "03 Mai", descricao: "Coloração — Ana Ferreira",        categoria: "Serviço", valor: 65  },
  { data: "02 Mai", descricao: "Corte & Brushing — Sofia R.",     categoria: "Serviço", valor: 35  },
  { data: "02 Mai", descricao: "Pestanas c/ Volume",               categoria: "Serviço", valor: 55  },
  { data: "01 Mai", descricao: "Coloração Total — B. Oliveira",   categoria: "Serviço", valor: 70  },
];

const DESPESAS = [
  { data: "02 Mai", descricao: "Tinta Loreal Inoa x12",          categoria: "Produtos",    valor: 84  },
  { data: "03 Mai", descricao: "Material de manicure",            categoria: "Produtos",    valor: 37  },
  { data: "04 Mai", descricao: "Limpeza mensal",                   categoria: "Serviços",    valor: 60  },
  { data: "05 Mai", descricao: "Subscrição VagasIA",              categoria: "Software",    valor: 29  },
  { data: "06 Mai", descricao: "Shampoos e condicionadores",      categoria: "Produtos",    valor: 52  },
];

const totalEntradas  = ENTRADAS.reduce((s, e) => s + e.valor, 0);
const totalDespesas  = DESPESAS.reduce((s, d) => s + d.valor, 0);
const utilidadeBruta = totalEntradas - totalDespesas;

const MONTHLY = [
  { mes: "Jan", entradas: 2840, despesas: 610 },
  { mes: "Fev", entradas: 3120, despesas: 580 },
  { mes: "Mar", entradas: 3450, despesas: 640 },
  { mes: "Abr", entradas: 3890, despesas: 700 },
  { mes: "Mai", entradas: totalEntradas, despesas: totalDespesas },
];

const maxVal = Math.max(...MONTHLY.map((m) => m.entradas));

export default function DemoFinanceiroPage() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">Financeiro</h1>
          <p className="text-sm text-slate-400 mt-0.5">Resumo de maio de 2026</p>
        </div>
        <div className="flex rounded-lg border border-white/10 bg-[#1E293B] p-0.5">
          {["Abr", "Mai"].map((m, i) => (
            <button key={m} className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${i === 1 ? "bg-[#00B4D8] text-white" : "text-slate-400"}`}>
              {m} 2026
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-white/5 bg-[#1E293B] p-5">
          <div className="flex items-start justify-between">
            <p className="text-xs text-slate-400 font-medium">Entradas</p>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#2DD4BF]/15">
              <TrendingUp size={16} className="text-[#2DD4BF]" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold text-white">€{totalEntradas}</p>
          <div className="mt-1 flex items-center gap-1 text-xs">
            <ArrowUpRight size={12} className="text-[#2DD4BF]" />
            <span className="text-[#2DD4BF] font-medium">+12%</span>
            <span className="text-slate-500">vs mês anterior</span>
          </div>
        </div>
        <div className="rounded-xl border border-white/5 bg-[#1E293B] p-5">
          <div className="flex items-start justify-between">
            <p className="text-xs text-slate-400 font-medium">Despesas</p>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/15">
              <TrendingDown size={16} className="text-red-400" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold text-white">€{totalDespesas}</p>
          <div className="mt-1 flex items-center gap-1 text-xs">
            <ArrowDownRight size={12} className="text-slate-500" />
            <span className="text-slate-500">este mês (parcial)</span>
          </div>
        </div>
        <div className="rounded-xl border border-[#00B4D8]/20 bg-[#00B4D8]/5 p-5">
          <div className="flex items-start justify-between">
            <p className="text-xs text-slate-400 font-medium">Utilidade bruta</p>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#00B4D8]/20">
              <Wallet size={16} className="text-[#00B4D8]" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold text-[#00B4D8]">€{utilidadeBruta}</p>
          <div className="mt-1 flex items-center gap-1 text-xs">
            <span className="text-slate-500">margem de</span>
            <span className="text-[#00B4D8] font-medium">{Math.round((utilidadeBruta / totalEntradas) * 100)}%</span>
          </div>
        </div>
      </div>

      {/* Mini bar chart (monthly trend) */}
      <div className="rounded-xl border border-white/5 bg-[#1E293B] p-5">
        <h2 className="text-sm font-semibold text-white mb-5">Evolução mensal</h2>
        <div className="flex items-end gap-4 h-28">
          {MONTHLY.map((m) => (
            <div key={m.mes} className="flex-1 flex flex-col items-center gap-1.5">
              <div className="w-full flex items-end gap-1 h-20">
                <div
                  className="flex-1 rounded-t-sm bg-[#2DD4BF]/60"
                  style={{ height: `${(m.entradas / maxVal) * 100}%` }}
                />
                <div
                  className="flex-1 rounded-t-sm bg-red-400/40"
                  style={{ height: `${(m.despesas / maxVal) * 100}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-500">{m.mes}</p>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-4 mt-3">
          <div className="flex items-center gap-1.5"><div className="h-2 w-4 rounded bg-[#2DD4BF]/60" /><span className="text-[11px] text-slate-500">Entradas</span></div>
          <div className="flex items-center gap-1.5"><div className="h-2 w-4 rounded bg-red-400/40" /><span className="text-[11px] text-slate-500">Despesas</span></div>
        </div>
      </div>

      {/* 2-col: entries + expenses */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">

        {/* Entradas */}
        <div className="rounded-xl border border-white/5 bg-[#1E293B] overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
            <h2 className="text-sm font-semibold text-white">Entradas</h2>
            <span className="text-xs font-semibold text-[#2DD4BF]">€{totalEntradas}</span>
          </div>
          <div className="divide-y divide-white/5 max-h-72 overflow-y-auto">
            {ENTRADAS.map((e, i) => (
              <div key={i} className="flex items-center gap-3 px-5 py-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#2DD4BF]/15">
                  <Banknote size={13} className="text-[#2DD4BF]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-white truncate">{e.descricao}</p>
                  <p className="text-[10px] text-slate-600">{e.data} · {e.categoria}</p>
                </div>
                <p className="text-sm font-semibold text-[#2DD4BF] shrink-0">+€{e.valor}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Despesas */}
        <div className="rounded-xl border border-white/5 bg-[#1E293B] overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
            <h2 className="text-sm font-semibold text-white">Despesas</h2>
            <span className="text-xs font-semibold text-red-400">€{totalDespesas}</span>
          </div>
          <div className="divide-y divide-white/5">
            {DESPESAS.map((d, i) => (
              <div key={i} className="flex items-center gap-3 px-5 py-3.5">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-red-500/15">
                  <TrendingDown size={13} className="text-red-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-white truncate">{d.descricao}</p>
                  <p className="text-[10px] text-slate-600">{d.data} · {d.categoria}</p>
                </div>
                <p className="text-sm font-semibold text-red-400 shrink-0">−€{d.valor}</p>
              </div>
            ))}
          </div>
          <div className="px-5 py-3 border-t border-white/5 bg-white/[0.02] flex items-center justify-between">
            <p className="text-xs text-slate-500">Utilidade bruta do período</p>
            <p className="text-sm font-bold text-[#00B4D8]">€{utilidadeBruta}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
