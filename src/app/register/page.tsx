"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Zap, Eye, EyeOff, Mail, RefreshCw, ShieldAlert } from "lucide-react";

declare global {
  interface Window {
    turnstile?: {
      render: (container: string | HTMLElement, options: Record<string, unknown>) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
  }
}

interface FormData {
  name: string;
  email: string;
  password: string;
  businessName: string;
  phone: string;
}

export default function RegisterPage() {
  const [form, setForm] = useState<FormData>({
    name: "",
    email: "",
    password: "",
    businessName: "",
    phone: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [emailExists, setEmailExists] = useState(false);
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendDone, setResendDone] = useState(false);

  // Turnstile: widget is "ready" once it fires the success callback
  // If no siteKey (local dev), skip and always allow
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";
  // turnstileReady: true when widget fires success callback (or no siteKey = dev mode)
  // turnstileErrorCode: Cloudflare error code (300010 = domain mismatch, 300030 = sitekey invalid, etc.)
  // When Turnstile errors, we degrade gracefully: form still submits, server rate-limit protects
  const [turnstileReady, setTurnstileReady] = useState(!siteKey);
  const [turnstileErrorCode, setTurnstileErrorCode] = useState<string | null>(null);
  const turnstileRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const tokenRef = useRef<string>("");

  useEffect(() => {
    if (!siteKey || !turnstileRef.current) return;

    const script = document.createElement("script");
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
    script.async = true;
    script.onload = () => {
      if (window.turnstile && turnstileRef.current) {
        widgetIdRef.current = window.turnstile.render(turnstileRef.current, {
          sitekey: siteKey,
          size: "compact",
          theme: "dark",
          callback: (token: string) => {
            tokenRef.current = token;
            setTurnstileReady(true);
            setTurnstileErrorCode(null);
          },
          "expired-callback": () => {
            tokenRef.current = "";
            setTurnstileReady(false);
          },
          "error-callback": (errorCode: string) => {
            tokenRef.current = "";
            // Capture exact code for diagnostics (300010=domain, 300030=sitekey, 110100=not found)
            console.error("[Turnstile] error-callback fired. code:", errorCode);
            setTurnstileErrorCode(errorCode ?? "unknown");
            // Do NOT set turnstileReady — button stays disabled, error is shown to user
          },
        });
      }
    };
    document.head.appendChild(script);

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
      }
      if (document.head.contains(script)) document.head.removeChild(script);
    };
  }, [siteKey]);

  function field(key: keyof FormData) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({ ...prev, [key]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setEmailExists(false);
    setLoading(true);

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, turnstileToken: tokenRef.current }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      if (data.code === "EMAIL_EXISTS") {
        setEmailExists(true);
      } else {
        setError(data.error ?? "Erro ao criar conta. Tente novamente.");
      }
      // Reset Turnstile for next attempt
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.reset(widgetIdRef.current);
        tokenRef.current = "";
        setTurnstileReady(false);
      }
      setLoading(false);
      return;
    }

    setConfirmed(true);
    setLoading(false);
  }

  async function handleResend() {
    setResending(true);
    setResendDone(false);
    await fetch("/api/auth/resend-confirmation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: form.email, name: form.name }),
    });
    setResending(false);
    setResendDone(true);
  }

  const inputClass =
    "w-full rounded-xl border border-white/10 bg-[#0F172A] px-4 py-3 text-white placeholder-slate-600 transition-colors focus:border-[#00B4D8] focus:outline-none";

  // — Email confirmation screen —
  if (confirmed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0F172A] p-4">
        <div className="w-full max-w-sm">
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
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#2A9D8F]/15">
              <Mail size={26} className="text-[#2DD4BF]" />
            </div>
            <h1 className="mb-3 text-xl font-bold text-white">Verifica a tua caixa de entrada</h1>
            <p className="mb-5 text-sm leading-relaxed text-slate-300">
              Enviámos um email de confirmação para{" "}
              <strong className="text-white">{form.email}</strong>.
              Clica no link para ativar a tua conta e entrar no VagasIA.
            </p>
            <div className="mb-6 rounded-lg border border-yellow-500/20 bg-yellow-500/5 px-4 py-3 text-left">
              <p className="text-xs text-yellow-400/80 leading-relaxed">
                💡 Se não encontrares o email na caixa de entrada, verifica a pasta de{" "}
                <strong className="text-yellow-300">spam</strong> ou{" "}
                <strong className="text-yellow-300">lixo</strong>.
              </p>
            </div>

            {resendDone ? (
              <p className="text-sm text-[#2DD4BF] font-medium">✓ Email reenviado com sucesso</p>
            ) : (
              <button
                onClick={handleResend}
                disabled={resending}
                className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors disabled:opacity-50"
              >
                <RefreshCw size={14} className={resending ? "animate-spin" : ""} />
                {resending ? "A reenviar…" : "Não recebi o email — reenviar"}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // — Registration form —
  const canSubmit = turnstileReady && !loading;

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0F172A] p-4">
      <div className="w-full max-w-sm">
        {/* Logótipo */}
        <div className="mb-8 flex items-center justify-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#00B4D8]">
            <Zap size={20} className="text-white" fill="white" />
          </div>
          <div>
            <p className="text-lg font-bold tracking-wide text-white">VagasIA</p>
            <p className="text-[11px] leading-none text-[#2DD4BF]">Sistema de Gestão</p>
          </div>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-white/5 bg-[#1E293B] p-8">
          <h1 className="mb-1 text-xl font-bold text-white">Criar conta</h1>
          <p className="mb-6 text-sm text-slate-400">
            Começa a gerir o teu negócio com o VagasIA.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Nome */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-400">
                O teu nome
              </label>
              <input
                type="text"
                required
                autoComplete="name"
                placeholder="Ex: Ana Silva"
                value={form.name}
                onChange={field("name")}
                className={inputClass}
              />
            </div>

            {/* Nome do negócio */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-400">
                Nome do negócio
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Cabeleireira Ana Silva"
                value={form.businessName}
                onChange={field("businessName")}
                className={inputClass}
              />
            </div>

            {/* Telefone */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-400">
                Telefone
              </label>
              <input
                type="tel"
                required
                placeholder="+351 912 345 678"
                value={form.phone}
                onChange={field("phone")}
                className={inputClass}
              />
            </div>

            {/* Email */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-400">
                Email
              </label>
              <input
                type="email"
                required
                autoComplete="email"
                placeholder="o.teu@email.com"
                value={form.email}
                onChange={field("email")}
                className={inputClass}
              />
            </div>

            {/* Password */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-400">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="new-password"
                  placeholder="Mínimo 6 caracteres"
                  value={form.password}
                  onChange={field("password")}
                  className={`${inputClass} pr-11`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Turnstile widget — visible compact, auto-verifies for real users */}
            {siteKey && (
              <div className="pt-1">
                {turnstileErrorCode ? (
                  <div className="flex items-center gap-2 rounded-lg border border-yellow-500/20 bg-yellow-500/5 px-3 py-2">
                    <ShieldAlert size={14} className="text-yellow-400 shrink-0" />
                    <p className="text-xs text-yellow-400">
                      Verificação de segurança indisponível (cód. {turnstileErrorCode}). Podes continuar o registo.
                    </p>
                  </div>
                ) : (
                  <div ref={turnstileRef} />
                )}
              </div>
            )}

            {emailExists && (
              <p className="rounded-lg bg-yellow-500/10 px-3 py-2.5 text-sm text-yellow-400">
                Este email já tem conta.{" "}
                <Link href="/login" className="font-semibold underline hover:text-yellow-300">
                  Clica aqui para entrar.
                </Link>
              </p>
            )}
            {error && (
              <p className="rounded-lg bg-red-500/10 px-3 py-2.5 text-sm text-red-400">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={!canSubmit}
              className="mt-2 w-full rounded-xl bg-[#00B4D8] py-3 font-semibold text-white transition-colors hover:bg-[#0090b0] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading
                ? "A criar conta…"
                : !turnstileReady && siteKey
                ? "A verificar segurança…"
                : "Criar conta"}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-slate-500">
            Já tens conta?{" "}
            <Link href="/login" className="text-[#00B4D8] hover:underline">
              Entrar
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
