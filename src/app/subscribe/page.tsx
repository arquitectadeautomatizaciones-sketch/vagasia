"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Zap, Check, LogOut } from "lucide-react";
import { createSupabaseBrowserClient } from "@/utils/supabase/client";

export const dynamic = "force-dynamic";

const FEATURES = [
  "Recuperação automática de vagas canceladas",
  "Lembretes automáticos via WhatsApp",
  "Base de dados de clientes na nuvem",
  "Módulo financeiro (entradas, despesas, utilidade)",
  "Inquéritos de satisfação com 3 KPIs",
  "Mensagens automáticas de aniversário",
  "Cartão de fidelização digital",
  "Assistente IA de suporte 24/7",
  "Até 2 colaboradoras incluídas",
  "Instalação e configuração incluídas",
  "Suporte presencial em Viana do Castelo",
  "7 dias grátis para experimentar",
];

function SubscribeContent() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const searchParams = useSearchParams();
  const cancelled = searchParams.get("cancelled") === "1";

  async function handleSubscribe() {
    setLoading(true);
    setError("");
    try {
      const supabase = createSupabaseBrowserClient();

      // Garantir sessão válida antes de chamar o endpoint
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        window.location.href = "/login?next=/subscribe";
        return;
      }

      // Refrescar token para garantir que o servidor recebe cookies atualizados
      await supabase.auth.refreshSession();

      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();

      if (res.status === 401) {
        window.location.href = "/login?next=/subscribe";
        return;
      }
      if (!res.ok || !data.url) {
        setError(data.error ?? "Erro ao criar sessão de pagamento.");
        return;
      }
      window.location.href = data.url;
    } catch {
      setError("Erro de rede. Tenta novamente.");
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  return (
    <div className="rounded-2xl border border-white/5 bg-[#1E293B] p-8">
      {cancelled && (
        <div className="mb-5 rounded-xl border border-yellow-500/20 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-300">
          Pagamento cancelado. Podes subscrever quando quiseres.
        </div>
      )}

      <div className="mb-2 text-center">
        <span className="inline-block rounded-full border border-[#00B4D8]/30 bg-[#00B4D8]/10 px-3 py-1 text-xs font-medium text-[#2DD4BF]">
          Subscrição mensal
        </span>
      </div>

      <div className="mb-6 text-center">
        <p className="text-4xl font-bold text-white">
          €37<span className="text-lg font-normal text-slate-400">/mês</span>
        </p>
        <p className="mt-1 text-sm text-slate-400">Cancela quando quiseres, sem compromisso.</p>
      </div>

      <ul className="mb-6 space-y-2.5">
        {FEATURES.map((f) => (
          <li key={f} className="flex items-center gap-3 text-sm text-slate-300">
            <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-[#00B4D8]/20">
              <Check size={12} className="text-[#2DD4BF]" />
            </span>
            {f}
          </li>
        ))}
      </ul>

      {error && (
        <p className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </p>
      )}

      <button
        onClick={handleSubscribe}
        disabled={loading}
        className="w-full rounded-xl bg-[#00B4D8] py-3.5 font-semibold text-white transition-colors hover:bg-[#0090b0] disabled:opacity-50"
      >
        {loading ? "A redirecionar…" : "Subscrever VagasIA por €37/mês"}
      </button>

      <button
        onClick={handleLogout}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 py-3 text-sm font-medium text-slate-400 transition-colors hover:border-white/20 hover:text-white"
      >
        <LogOut size={15} />
        Terminar sessão
      </button>
    </div>
  );
}

export default function SubscribePage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0F172A] p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex items-center justify-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#00B4D8]">
            <Zap size={20} className="text-white" fill="white" />
          </div>
          <div className="text-left">
            <p className="text-lg font-bold tracking-wide text-white">VagasIA</p>
            <p className="text-[11px] leading-none text-[#2DD4BF]">Sistema de Gestão</p>
          </div>
        </div>

        <Suspense fallback={<div className="rounded-2xl border border-white/5 bg-[#1E293B] p-8" />}>
          <SubscribeContent />
        </Suspense>
      </div>
    </div>
  );
}
