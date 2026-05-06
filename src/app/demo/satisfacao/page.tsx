import { Star, TrendingUp, MessageSquare, ThumbsUp } from "lucide-react";

const METRICS = [
  { label: "Qualidade do serviço", value: 4.8, responses: 47 },
  { label: "Tempo de espera",      value: 4.3, responses: 47 },
  { label: "Simpatia",             value: 4.9, responses: 47 },
  { label: "Preço/qualidade",      value: 4.6, responses: 47 },
  { label: "Limpeza e conforto",   value: 4.7, responses: 47 },
];

const REVIEWS = [
  { name: "Mariana Costa",    nota: 5, data: "Hoje",      texto: "Adorei o resultado! A coloração ficou exactamente como pedi. Vou definitivamente voltar." },
  { name: "Beatriz Oliveira", nota: 5, data: "Ontem",     texto: "Muito profissional. A Joana é fantástica e o salão está sempre impecável." },
  { name: "Rita Fonseca",     nota: 4, data: "2 Mai",     texto: "Gostei muito do serviço. Só achei que esperei um pouco mais do que o esperado para o começo." },
  { name: "Sofia Rodrigues",  nota: 5, data: "30 Abr",    texto: "Melhor manicure que fiz! Super recomendo." },
  { name: "Catarina Lima",    nota: 5, data: "29 Abr",    texto: "O tratamento capilar foi incrível. O meu cabelo ficou muito mais hidratado e brilhante." },
  { name: "Inês Santos",      nota: 4, data: "28 Abr",    texto: "Boa experiência no geral. O corte ficou muito bonito, só achei o preço um pouco elevado." },
  { name: "Leonor Carvalho",  nota: 5, data: "27 Abr",    texto: "Equipa simpática e muito atenciosa. O resultado superou as minhas expectativas!" },
];

const DISTRIBUTION = [
  { stars: 5, count: 36 },
  { stars: 4, count: 8  },
  { stars: 3, count: 2  },
  { stars: 2, count: 1  },
  { stars: 1, count: 0  },
];

const totalReviews = DISTRIBUTION.reduce((s, d) => s + d.count, 0);
const overallScore = (DISTRIBUTION.reduce((s, d) => s + d.stars * d.count, 0) / totalReviews).toFixed(1);

function Stars({ value, size = 13 }: { value: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={size}
          className={i < value ? "text-yellow-400" : "text-slate-700"}
          fill={i < value ? "#facc15" : "none"}
        />
      ))}
    </div>
  );
}

function ScoreBar({ value, max }: { value: number; max: number }) {
  const pct = (value / 5) * 100;
  const color = value >= 4.5 ? "#2DD4BF" : value >= 4.0 ? "#00B4D8" : "#f87171";
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 rounded-full bg-white/5 overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <div className="flex items-center gap-1 w-10 shrink-0">
        <Star size={10} fill={color} className="shrink-0" style={{ color }} />
        <span className="text-xs font-semibold text-white">{value}</span>
      </div>
    </div>
  );
}

export default function DemoSatisfacaoPage() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-white">Satisfação</h1>
        <p className="text-sm text-slate-400 mt-0.5">Respostas ao questionário de satisfação</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-white/5 bg-[#1E293B] p-5">
          <div className="flex items-start justify-between">
            <p className="text-xs text-slate-400">Nota global</p>
            <Star size={15} fill="#facc15" className="text-yellow-400" />
          </div>
          <p className="mt-3 text-3xl font-bold text-white">{overallScore}</p>
          <p className="mt-1 text-xs text-slate-500">em 5 estrelas</p>
        </div>
        <div className="rounded-xl border border-white/5 bg-[#1E293B] p-5">
          <div className="flex items-start justify-between">
            <p className="text-xs text-slate-400">Respostas</p>
            <MessageSquare size={15} className="text-[#00B4D8]" />
          </div>
          <p className="mt-3 text-3xl font-bold text-white">{totalReviews}</p>
          <p className="mt-1 text-xs text-slate-500">questionários respondidos</p>
        </div>
        <div className="rounded-xl border border-white/5 bg-[#1E293B] p-5">
          <div className="flex items-start justify-between">
            <p className="text-xs text-slate-400">5 estrelas</p>
            <ThumbsUp size={15} className="text-[#2DD4BF]" />
          </div>
          <p className="mt-3 text-3xl font-bold text-white">{Math.round((DISTRIBUTION[0].count / totalReviews) * 100)}%</p>
          <p className="mt-1 text-xs text-slate-500">{DISTRIBUTION[0].count} clientes</p>
        </div>
        <div className="rounded-xl border border-white/5 bg-[#1E293B] p-5">
          <div className="flex items-start justify-between">
            <p className="text-xs text-slate-400">NPS</p>
            <TrendingUp size={15} className="text-[#2DD4BF]" />
          </div>
          <p className="mt-3 text-3xl font-bold text-[#2DD4BF]">+78</p>
          <p className="mt-1 text-xs text-slate-500">Net Promoter Score</p>
        </div>
      </div>

      {/* 2-col: metrics + distribution */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">

        {/* Category scores */}
        <div className="rounded-xl border border-white/5 bg-[#1E293B]">
          <div className="px-5 py-4 border-b border-white/5">
            <h2 className="text-sm font-semibold text-white">Avaliação por categoria</h2>
          </div>
          <div className="p-5 space-y-4">
            {METRICS.map((m) => (
              <div key={m.label} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-slate-300">{m.label}</p>
                </div>
                <ScoreBar value={m.value} max={5} />
              </div>
            ))}
          </div>
        </div>

        {/* Star distribution */}
        <div className="rounded-xl border border-white/5 bg-[#1E293B]">
          <div className="px-5 py-4 border-b border-white/5">
            <h2 className="text-sm font-semibold text-white">Distribuição de notas</h2>
          </div>
          <div className="p-5 space-y-3">
            {DISTRIBUTION.map((d) => (
              <div key={d.stars} className="flex items-center gap-3">
                <Stars value={d.stars} size={12} />
                <div className="flex-1 h-2 rounded-full bg-white/5 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-yellow-400/70"
                    style={{ width: `${totalReviews > 0 ? (d.count / totalReviews) * 100 : 0}%` }}
                  />
                </div>
                <span className="text-xs text-slate-500 w-6 text-right">{d.count}</span>
              </div>
            ))}
          </div>
          <div className="px-5 pb-5">
            <div className="rounded-lg bg-white/[0.03] px-4 py-3 flex items-center justify-between">
              <p className="text-xs text-slate-500">Média ponderada</p>
              <div className="flex items-center gap-1.5">
                <Stars value={5} size={11} />
                <span className="text-sm font-bold text-white">{overallScore}/5</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Latest reviews */}
      <div className="rounded-xl border border-white/5 bg-[#1E293B]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
          <h2 className="text-sm font-semibold text-white">Últimas respostas</h2>
          <span className="text-xs text-slate-500">{REVIEWS.length} mais recentes</span>
        </div>
        <div className="divide-y divide-white/5">
          {REVIEWS.map((r, i) => (
            <div key={i} className="px-5 py-4 space-y-2">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#00B4D8]/20 text-xs font-bold text-[#00B4D8]">
                  {r.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white">{r.name}</p>
                  <p className="text-[11px] text-slate-500">{r.data}</p>
                </div>
                <Stars value={r.nota} size={12} />
              </div>
              <p className="text-sm text-slate-400 leading-relaxed pl-11">{r.texto}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
