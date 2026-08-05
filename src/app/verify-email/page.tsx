"use client";

import { useState, useEffect } from "react";
import { Zap, Mail, RefreshCw } from "lucide-react";
import { createSupabaseBrowserClient } from "@/utils/supabase/client";

export default function VerifyEmailPage() {
  const [email, setEmail] = useState("");
  const [resending, setResending] = useState(false);
  const [resendDone, setResendDone] = useState(false);

  useEffect(() => {
    createSupabaseBrowserClient()
      .auth.getUser()
      .then(({ data: { user } }) => {
        if (user?.email) setEmail(user.email);
      });
  }, []);

  async function handleResend() {
    if (!email) return;
    setResending(true);
    setResendDone(false);
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.resend({ type: "signup", email });
    setResending(false);
    setResendDone(true);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0F172A] p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 flex items-center justify-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#00B4D8]">
            <Zap size={20} className="text-white" fill="white" />
          </div>
          <div>
            <p className="text-lg font-bold tracking-wide text-white">VagasIA</p>
            <p className="text-[11px] leading-none text-[#2DD4BF]">Sistema de Gestão</p>
          </div>
        </div>

        <div className="rounded-2xl border border-white/5 bg-[#1E293B] p-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#00B4D8]/10">
            <Mail size={26} className="text-[#00B4D8]" />
          </div>
          <h1 className="mb-2 text-xl font-bold text-white">Confirma o teu email</h1>
          <p className="mb-2 text-sm text-slate-400">
            Enviámos um link de confirmação para:
          </p>
          {email && (
            <p className="mb-6 text-sm font-semibold text-white break-all">{email}</p>
          )}
          <p className="mb-6 text-xs text-slate-500 leading-relaxed">
            Clica no link no email para ativar a tua conta. Se não o vires na caixa de entrada,
            verifica a pasta de <strong className="text-slate-400">spam</strong> ou{" "}
            <strong className="text-slate-400">lixo</strong>.
          </p>

          {resendDone ? (
            <p className="text-sm text-[#2DD4BF]">Email reenviado ✓</p>
          ) : (
            <button
              onClick={handleResend}
              disabled={resending || !email}
              className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors disabled:opacity-50"
            >
              <RefreshCw size={14} className={resending ? "animate-spin" : ""} />
              {resending ? "A reenviar…" : "Reenviar email"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
