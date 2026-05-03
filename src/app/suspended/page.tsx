"use client";

import { Zap, AlertTriangle } from "lucide-react";
import { createSupabaseBrowserClient } from "@/utils/supabase/client";

export default function SuspendedPage() {
  async function handleLogout() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0F172A] p-4">
      <div className="w-full max-w-sm text-center">
        {/* Logo */}
        <div className="mb-8 flex items-center justify-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#00B4D8]">
            <Zap size={20} className="text-white" fill="white" />
          </div>
          <div className="text-left">
            <p className="text-lg font-bold tracking-wide text-white">VagasIA</p>
            <p className="text-[11px] leading-none text-[#2DD4BF]">Sistema de Gestión</p>
          </div>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-yellow-500/20 bg-[#1E293B] p-8">
          <div className="mb-4 flex justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-yellow-500/10">
              <AlertTriangle size={28} className="text-yellow-400" />
            </div>
          </div>

          <h1 className="mb-2 text-xl font-bold text-white">Cuenta suspendida</h1>
          <p className="mb-6 text-sm text-slate-400">
            Tu acceso a VagasIA ha sido suspendido temporalmente. Comunícate con el equipo de VagasIA para restablecer tu cuenta.
          </p>

          <a
            href="https://wa.me/1234567890"
            target="_blank"
            rel="noopener noreferrer"
            className="mb-3 flex w-full items-center justify-center rounded-xl bg-[#00B4D8] py-3 font-semibold text-white transition-colors hover:bg-[#0090b0]"
          >
            Contactar soporte
          </a>

          <button
            onClick={handleLogout}
            className="w-full rounded-xl border border-white/10 py-3 text-sm font-medium text-slate-400 transition-colors hover:border-white/20 hover:text-white"
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    </div>
  );
}
