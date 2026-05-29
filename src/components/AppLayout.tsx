"use client";

import { useState } from "react";
import { Menu, Zap } from "lucide-react";
import Sidebar from "./Sidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-[#0F172A]">
      {/* ── Sidebar desktop (visible ≥ md) ─────────────────── */}
      <div className="hidden md:flex">
        <Sidebar />
      </div>

      {/* ── Drawer móvil ─────────────────────────────────────── */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          {/* Fondo semitransparente — clic cierra el menú */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          {/* Panel del menú */}
          <div className="relative z-10 flex h-full">
            <Sidebar onClose={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      {/* ── Área principal ───────────────────────────────────── */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar móvil — solo visible en < md */}
        <header className="flex items-center gap-3 border-b border-white/5 bg-[#1E293B] px-4 py-3 md:hidden">
          <button
            onClick={() => setMobileOpen(true)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
            aria-label="Abrir menu"
          >
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#00B4D8]">
              <Zap size={14} className="text-white" fill="white" />
            </div>
            <p className="text-sm font-bold tracking-wide text-white">VagasIA</p>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
