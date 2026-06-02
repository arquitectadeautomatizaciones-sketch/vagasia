"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Zap, Eye, EyeOff, Loader2 } from "lucide-react";
import { createSupabaseBrowserClient } from "@/utils/supabase/client";

interface InviteData {
  email: string;
  ownerName: string;
  businessName: string;
}

const inputCls =
  "w-full rounded-xl border border-white/10 bg-[#0F172A] px-4 py-3 text-white placeholder-slate-600 transition-colors focus:border-[#00B4D8] focus:outline-none";

export default function InvitePage() {
  const params   = useParams();
  const router   = useRouter();
  const token    = params.token as string;

  const [invite,      setInvite]      = useState<InviteData | null>(null);
  const [loadError,   setLoadError]   = useState("");
  const [loading,     setLoading]     = useState(true);

  const [name,        setName]        = useState("");
  const [password,    setPassword]    = useState("");
  const [showPass,    setShowPass]    = useState(false);
  const [submitting,  setSubmitting]  = useState(false);
  const [submitError, setSubmitError] = useState("");

  // Cargar datos de la invitación al montar
  useEffect(() => {
    if (!token) return;
    fetch(`/api/invite/${token}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) { setLoadError(data.error); }
        else            { setInvite(data); }
      })
      .catch(() => setLoadError("Erro ao carregar o convite."))
      .finally(() => setLoading(false));
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim())        { setSubmitError("O nome é obrigatório."); return; }
    if (password.length < 6) { setSubmitError("A password deve ter pelo menos 6 caracteres."); return; }

    setSubmitError("");
    setSubmitting(true);

    try {
      // 1. Aceptar la invitación (crea usuario en Auth + vincula professional)
      const res = await fetch("/api/invite/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, name: name.trim(), password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSubmitError(data.error ?? "Erro ao aceitar o convite.");
        return;
      }

      // 2. Iniciar sesión automáticamente
      const supabase = createSupabaseBrowserClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email:    invite!.email,
        password,
      });
      if (signInError) {
        setSubmitError("Conta criada! Faz login para continuar.");
        router.push("/login");
        return;
      }

      // 3. Redirigir al dashboard
      router.push("/dashboard");

    } catch {
      setSubmitError("Erro inesperado. Tenta novamente.");
    } finally {
      setSubmitting(false);
    }
  }

  // ── Estado de carga ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0F172A]">
        <Loader2 size={28} className="animate-spin text-slate-500" />
      </div>
    );
  }

  // ── Token inválido / expirado ────────────────────────────────────────────
  if (loadError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0F172A] p-4">
        <div className="w-full max-w-sm text-center">
          <div className="mb-6 flex items-center justify-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#00B4D8]">
              <Zap size={20} className="text-white" fill="white" />
            </div>
            <div>
              <p className="text-lg font-bold tracking-wide text-white">VagasIA</p>
              <p className="text-[11px] leading-none text-[#2DD4BF]">Sistema de Gestão</p>
            </div>
          </div>
          <div className="rounded-2xl border border-white/5 bg-[#1E293B] p-8">
            <p className="text-4xl mb-4">🔗</p>
            <h1 className="mb-2 text-xl font-bold text-white">
              Convite inválido
            </h1>
            <p className="text-sm text-slate-400 leading-relaxed">
              {loadError === "Este convite já foi utilizado."
                ? "Este convite já foi aceite. Faz login para aceder à tua conta."
                : "Este link de convite não é válido ou já expirou."}
            </p>
            {loadError === "Este convite já foi utilizado." && (
              <a
                href="/login"
                className="mt-6 block w-full rounded-xl bg-[#00B4D8] py-3 text-center font-semibold text-white transition-colors hover:bg-[#0090b0]"
              >
                Ir para o login
              </a>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Formulario de aceptación ─────────────────────────────────────────────
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

        {/* Card */}
        <div className="rounded-2xl border border-white/5 bg-[#1E293B] p-8">

          {/* Mensaje de invitación */}
          <div className="mb-6">
            <p className="text-sm text-[#00B4D8] font-medium mb-2">Tens um convite! 🎉</p>
            <h1 className="text-xl font-bold text-white leading-snug">
              {invite!.ownerName} convidou-te para te juntares a{" "}
              <span className="text-[#2DD4BF]">{invite!.businessName}</span>{" "}
              no VagasIA
            </h1>
          </div>

          <p className="mb-6 text-sm text-slate-400 leading-relaxed">
            Cria a tua conta para começares a gerir a tua agenda. Os teus horários e serviços já estão configurados!
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Nombre */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-400">
                O teu nome
              </label>
              <input
                type="text"
                required
                autoFocus
                autoComplete="name"
                placeholder="Ex: Ana Silva"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={inputCls}
              />
            </div>

            {/* Email — prefilled, solo lectura */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-400">
                Email
              </label>
              <input
                type="email"
                readOnly
                value={invite!.email}
                className={`${inputCls} cursor-not-allowed opacity-50`}
                tabIndex={-1}
              />
            </div>

            {/* Password */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-400">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  required
                  autoComplete="new-password"
                  placeholder="Mínimo 6 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`${inputCls} pr-11`}
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {submitError && (
              <p className="rounded-lg bg-red-500/10 px-3 py-2.5 text-sm text-red-400">
                {submitError}
              </p>
            )}

            {/* Botón */}
            <button
              type="submit"
              disabled={submitting}
              className="mt-2 w-full rounded-xl bg-[#00B4D8] py-3 font-semibold text-white transition-colors hover:bg-[#0090b0] disabled:opacity-50"
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 size={16} className="animate-spin" />
                  A criar conta…
                </span>
              ) : (
                "Aceitar convite"
              )}
            </button>
          </form>

        </div>

        <p className="mt-5 text-center text-xs text-slate-600">
          Se não esperavas este convite, ignora esta página.
        </p>

      </div>
    </div>
  );
}
