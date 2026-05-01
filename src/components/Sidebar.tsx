"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  Clock,
  Settings,
  Zap,
  CalendarCheck,
  Wallet,
  LogOut,
} from "lucide-react";
import { createSupabaseBrowserClient } from "@/utils/supabase/client";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/marcacoes", label: "Marcações", icon: CalendarDays },
  { href: "/clientes", label: "Clientes", icon: Users },
  { href: "/lista-espera", label: "Lista de Espera", icon: Clock },
  { href: "/vagas-disponiveis", label: "Vagas Disponíveis", icon: CalendarCheck },
  { href: "/financeiro", label: "Financeiro", icon: Wallet },
  { href: "/configuracoes", label: "Configurações", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [businessName, setBusinessName] = useState("VagasIA");

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      const name = user?.app_metadata?.business_name as string | undefined;
      if (name) setBusinessName(name);
    });
  }, []);

  async function handleLogout() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  return (
    <aside className="flex h-screen w-60 flex-col border-r border-white/5 bg-[#1E293B]">
      {/* Logótipo */}
      <div className="flex items-center gap-2.5 border-b border-white/5 px-5 py-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#00B4D8]">
          <Zap size={16} className="text-white" fill="white" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold tracking-wide text-white">VagasIA</p>
          <p className="truncate text-[10px] leading-none text-[#2DD4BF]">{businessName}</p>
        </div>
      </div>

      {/* Navegação */}
      <nav className="flex flex-1 flex-col gap-0.5 p-3">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                active
                  ? "bg-[#00B4D8]/15 font-medium text-[#00B4D8]"
                  : "text-slate-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              <Icon size={17} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Terminar sessão */}
      <div className="border-t border-white/5 p-3">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-400 transition-colors hover:bg-white/5 hover:text-white"
        >
          <LogOut size={17} />
          Terminar Sessão
        </button>
      </div>
    </aside>
  );
}
