"use client";

import { useState } from "react";
import Link from "next/link";
import { Zap, Eye, EyeOff } from "lucide-react";
import { createSupabaseBrowserClient } from "@/utils/supabase/client";

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

  function field(key: keyof FormData) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({ ...prev, [key]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setEmailExists(false);
    setLoading(true);

    // 1. Criar conta + negócio via API
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      if (data.code === "EMAIL_EXISTS") {
        setEmailExists(true);
      } else {
        setError(data.error ?? "Erro ao criar conta. Tente novamente.");
      }
      setLoading(false);
      return;
    }

    // 2. Iniciar sessão automaticamente
    const supabase = createSupabaseBrowserClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password,
    });

    if (signInError) {
      setError("Conta criada com sucesso! Faz login para continuar.");
      setLoading(false);
      return;
    }

    window.location.href = "/onboarding";
  }

  const inputClass =
    "w-full rounded-xl border border-white/10 bg-[#0F172A] px-4 py-3 text-white placeholder-slate-600 transition-colors focus:border-[#00B4D8] focus:outline-none";

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
              disabled={loading}
              className="mt-2 w-full rounded-xl bg-[#00B4D8] py-3 font-semibold text-white transition-colors hover:bg-[#0090b0] disabled:opacity-50"
            >
              {loading ? "A criar conta…" : "Criar conta"}
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
