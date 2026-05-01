"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Zap, Eye, EyeOff } from "lucide-react";
import { createSupabaseBrowserClient } from "@/utils/supabase/client";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError("Email ou password incorretos. Verifica os teus dados.");
      setLoading(false);
      return;
    }

    window.location.href = next;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-400">
          Email
        </label>
        <input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="o.teu@email.com"
          className="w-full rounded-xl border border-white/10 bg-[#0F172A] px-4 py-3 text-white placeholder-slate-600 transition-colors focus:border-[#00B4D8] focus:outline-none"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-400">
          Password
        </label>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full rounded-xl border border-white/10 bg-[#0F172A] px-4 py-3 pr-11 text-white placeholder-slate-600 transition-colors focus:border-[#00B4D8] focus:outline-none"
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

      {error && (
        <p className="rounded-lg bg-red-500/10 px-3 py-2.5 text-sm text-red-400">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="mt-2 w-full rounded-xl bg-[#00B4D8] py-3 font-semibold text-white transition-colors hover:bg-[#0090b0] disabled:opacity-50"
      >
        {loading ? "A entrar…" : "Entrar"}
      </button>
    </form>
  );
}

export default function LoginPage() {
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
          <h1 className="mb-1 text-xl font-bold text-white">Entrar</h1>
          <p className="mb-6 text-sm text-slate-400">
            Acede à tua conta para gerir o teu negócio.
          </p>

          <Suspense fallback={null}>
            <LoginForm />
          </Suspense>

          <p className="mt-5 text-center text-sm text-slate-500">
            Ainda não tens conta?{" "}
            <Link href="/register" className="text-[#00B4D8] hover:underline">
              Criar conta
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
