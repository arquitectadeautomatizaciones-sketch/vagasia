"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Star, Zap, CheckCircle, Loader2 } from "lucide-react";

const RATING_LABELS = ["", "Muito mau", "Mau", "Razoável", "Bom", "Excelente"];

function StarRating({
  value,
  onChange,
  disabled,
}: {
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
}) {
  const [hovered, setHovered] = useState(0);
  const active = hovered || value;

  return (
    <div className="space-y-2">
      <div className="flex gap-3">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={disabled}
            onClick={() => onChange(star)}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            className="transition-transform hover:scale-110 active:scale-95 disabled:pointer-events-none focus:outline-none"
          >
            <Star
              size={36}
              fill={star <= active ? "#00B4D8" : "none"}
              className={`transition-colors ${star <= active ? "text-[#00B4D8]" : "text-slate-600"}`}
            />
          </button>
        ))}
      </div>
      <p className="h-4 text-xs text-slate-500">{active > 0 ? RATING_LABELS[active] : " "}</p>
    </div>
  );
}

type PageState = "loading" | "form" | "done" | "already_answered" | "not_found" | "error";

export default function SurveyPage() {
  const params = useParams<{ token: string }>();
  const token = params.token;

  const [state, setState] = useState<PageState>("loading");
  const [clientName, setClientName] = useState<string | null>(null);
  const [businessName, setBusinessName] = useState<string | null>(null);
  const [qualidade, setQualidade] = useState(0);
  const [tempoEspera, setTempoEspera] = useState(0);
  const [simpatia, setSimpatia] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch(`/api/survey/${token}`)
      .then(async (r) => {
        const data = await r.json();
        if (r.status === 404) { setState("not_found"); return; }
        if (r.status === 409) { setState("already_answered"); return; }
        if (!r.ok) { setState("error"); return; }
        setClientName(data.clientName);
        setBusinessName(data.businessName);
        setState("form");
      })
      .catch(() => setState("error"));
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!qualidade || !tempoEspera || !simpatia) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/survey/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qualidade, tempo_espera: tempoEspera, simpatia }),
      });
      if (res.ok) setState("done");
      else setState("error");
    } catch {
      setState("error");
    } finally {
      setSubmitting(false);
    }
  }

  const canSubmit = qualidade > 0 && tempoEspera > 0 && simpatia > 0;

  return (
    <div className="min-h-screen bg-[#0F172A] px-5 py-10 flex flex-col items-center">
      {/* Logo */}
      <div className="flex items-center gap-2.5 mb-10">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#00B4D8]">
          <Zap size={18} className="text-white" fill="white" />
        </div>
        <span className="text-lg font-bold text-white tracking-wide">VagasIA</span>
      </div>

      {/* Loading */}
      {state === "loading" && (
        <div className="flex flex-col items-center gap-4 mt-20">
          <Loader2 size={32} className="animate-spin text-slate-600" />
          <p className="text-sm text-slate-500">A carregar…</p>
        </div>
      )}

      {/* Not found */}
      {state === "not_found" && (
        <div className="w-full max-w-md rounded-2xl border border-white/5 bg-[#1E293B] p-8 text-center">
          <p className="text-2xl mb-3">🔍</p>
          <h1 className="text-base font-semibold text-white mb-2">Inquérito não encontrado</h1>
          <p className="text-sm text-slate-400">O link que utilizaste não é válido ou expirou.</p>
        </div>
      )}

      {/* Already answered */}
      {state === "already_answered" && (
        <div className="w-full max-w-md rounded-2xl border border-white/5 bg-[#1E293B] p-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#2DD4BF]/15">
            <CheckCircle size={28} className="text-[#2DD4BF]" />
          </div>
          <h1 className="text-base font-semibold text-white mb-2">Já respondeste a este inquérito</h1>
          <p className="text-sm text-slate-400">A tua avaliação já foi registada. Obrigada!</p>
        </div>
      )}

      {/* Error */}
      {state === "error" && (
        <div className="w-full max-w-md rounded-2xl border border-red-500/20 bg-[#1E293B] p-8 text-center">
          <p className="text-2xl mb-3">⚠️</p>
          <h1 className="text-base font-semibold text-white mb-2">Ocorreu um erro</h1>
          <p className="text-sm text-slate-400">Tenta novamente mais tarde.</p>
        </div>
      )}

      {/* Done */}
      {state === "done" && (
        <div className="w-full max-w-md rounded-2xl border border-white/5 bg-[#1E293B] p-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#2DD4BF]/15">
            <CheckCircle size={32} className="text-[#2DD4BF]" />
          </div>
          <h1 className="text-xl font-semibold text-white mb-2">Obrigada pela tua avaliação!</h1>
          <p className="text-sm text-slate-400 leading-relaxed">
            A tua opinião é muito importante para nós e ajuda-nos a melhorar o nosso serviço.
          </p>
          <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#00B4D8]/10 px-4 py-2">
            <Star size={14} fill="#00B4D8" className="text-[#00B4D8]" />
            <span className="text-xs text-[#00B4D8] font-medium">Avaliação registada com sucesso</span>
          </div>
        </div>
      )}

      {/* Form */}
      {state === "form" && (
        <div className="w-full max-w-md">
          <div className="rounded-2xl border border-white/5 bg-[#1E293B] p-7 shadow-2xl">
            {/* Header */}
            <div className="mb-7">
              <h1 className="text-xl font-semibold text-white">
                {clientName ? `Olá, ${clientName.split(" ")[0]}!` : "A tua opinião importa!"}
              </h1>
              <p className="mt-1.5 text-sm text-slate-400 leading-relaxed">
                {businessName
                  ? `Diz-nos o que achaste do serviço em ${businessName}.`
                  : "Partilha a tua opinião sobre o nosso serviço."}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-7">
              {/* Qualidade */}
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-white">Qualidade do serviço</p>
                  <p className="text-xs text-slate-500 mt-0.5">Como avalias a qualidade do trabalho realizado?</p>
                </div>
                <StarRating value={qualidade} onChange={setQualidade} disabled={submitting} />
              </div>

              <div className="border-t border-white/5" />

              {/* Tempo de espera */}
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-white">Tempo de espera</p>
                  <p className="text-xs text-slate-500 mt-0.5">Ficaste satisfeita com o tempo de espera?</p>
                </div>
                <StarRating value={tempoEspera} onChange={setTempoEspera} disabled={submitting} />
              </div>

              <div className="border-t border-white/5" />

              {/* Simpatia */}
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-white">Simpatia da equipa</p>
                  <p className="text-xs text-slate-500 mt-0.5">Como avalias a simpatia e o atendimento?</p>
                </div>
                <StarRating value={simpatia} onChange={setSimpatia} disabled={submitting} />
              </div>

              <button
                type="submit"
                disabled={!canSubmit || submitting}
                className="mt-2 w-full rounded-xl bg-[#00B4D8] py-3.5 text-sm font-semibold text-white transition-colors hover:bg-[#0090b0] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {submitting ? "A enviar…" : "Enviar avaliação"}
              </button>

              {!canSubmit && (
                <p className="text-center text-xs text-slate-600">
                  Responde às 3 perguntas para poderes enviar.
                </p>
              )}
            </form>
          </div>

          <p className="mt-6 text-center text-xs text-slate-700">
            Powered by VagasIA · A tua avaliação é anónima e confidencial
          </p>
        </div>
      )}
    </div>
  );
}
