"use client";

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
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/marcacoes", label: "Marcações", icon: CalendarDays },
  { href: "/clientes", label: "Clientes", icon: Users },
  { href: "/lista-espera", label: "Lista de Espera", icon: Clock },
  { href: "/vagas-disponiveis", label: "Vagas Disponíveis", icon: CalendarCheck },
  { href: "/configuracoes", label: "Configurações", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-60 flex-col border-r border-white/5 bg-[#1E293B]">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-white/5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#00B4D8]">
          <Zap size={16} className="text-white" fill="white" />
        </div>
        <div>
          <p className="text-sm font-bold text-white tracking-wide">VagasIA</p>
          <p className="text-[10px] text-[#2DD4BF] leading-none">Cabeleireira Lisboa</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-0.5 p-3 flex-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                active
                  ? "bg-[#00B4D8]/15 text-[#00B4D8] font-medium"
                  : "text-slate-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              <Icon size={17} />
              {label}
            </Link>
          );
        })}
      </nav>

    </aside>
  );
}
