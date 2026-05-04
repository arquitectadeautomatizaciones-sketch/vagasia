"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
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
  Cake,
  Star,
  Award,
} from "lucide-react";
import { createSupabaseBrowserClient } from "@/utils/supabase/client";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/marcacoes", label: "Marcações", icon: CalendarDays },
  { href: "/clientes", label: "Clientes", icon: Users },
  { href: "/aniversarios", label: "Aniversários", icon: Cake },
  { href: "/lista-espera", label: "Lista de Espera", icon: Clock },
  { href: "/vagas-disponiveis", label: "Vagas Disponíveis", icon: CalendarCheck },
  { href: "/fidelizacao", label: "Fidelização", icon: Award },
  { href: "/satisfacao", label: "Satisfação", icon: Star },
  { href: "/financeiro", label: "Financeiro", icon: Wallet },
  { href: "/configuracoes", label: "Configurações", icon: Settings },
];

interface SidebarProps {
  /** Override for demo mode — skips Supabase calls */
  demoBusinessName?: string;
  demoLogoInitials?: string;
}

export default function Sidebar({ demoBusinessName, demoLogoInitials }: SidebarProps = {}) {
  const pathname = usePathname();
  const [businessName, setBusinessName] = useState(demoBusinessName ?? "VagasIA");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [initials, setInitials] = useState(demoLogoInitials ?? "V");
  const isDemo = !!demoBusinessName;

  useEffect(() => {
    if (isDemo) return;
    const supabase = createSupabaseBrowserClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      const name = user?.app_metadata?.business_name as string | undefined;
      const businessId = user?.app_metadata?.business_id as string | undefined;
      if (name) {
        setBusinessName(name);
        setInitials(
          name
            .split(" ")
            .slice(0, 2)
            .map((w: string) => w[0])
            .join("")
            .toUpperCase()
        );
      }
      if (businessId) {
        supabase
          .from("businesses")
          .select("logo_url")
          .eq("id", businessId)
          .single()
          .then(({ data }) => {
            const row = data as { logo_url?: string } | null;
            if (row?.logo_url) setLogoUrl(row.logo_url);
          });
      }
    });
  }, [isDemo]);

  async function handleLogout() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  return (
    <aside className="flex h-screen w-60 flex-col border-r border-white/5 bg-[#1E293B]">
      {/* Header: logo + nome do negócio */}
      <div className="flex flex-col items-center gap-2 border-b border-white/5 px-4 py-5">
        {logoUrl ? (
          <Image
            src={logoUrl}
            alt="Logo"
            width={48}
            height={48}
            className="h-12 w-12 rounded-xl object-cover border border-white/10"
          />
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#00B4D8]/20 text-sm font-bold text-[#00B4D8]">
            {initials}
          </div>
        )}
        <div className="text-center min-w-0 w-full px-1">
          <p className="truncate text-sm font-semibold text-white leading-tight">
            {businessName}
          </p>
          <div className="flex items-center justify-center gap-1 mt-0.5">
            <Zap size={9} className="text-[#2DD4BF]" fill="#2DD4BF" />
            <p className="text-[10px] leading-none text-[#2DD4BF]">VagasIA</p>
          </div>
        </div>
      </div>

      {/* Navegação */}
      <nav className="flex flex-1 flex-col gap-0.5 p-3">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={isDemo ? "/demo" : href}
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

      {/* Terminar sessão / demo CTA */}
      <div className="border-t border-white/5 p-3">
        {isDemo ? (
          <Link
            href="/register"
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#00B4D8] px-3 py-2.5 text-sm font-medium text-white hover:bg-[#0090b0] transition-colors"
          >
            Criar conta grátis
          </Link>
        ) : (
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-400 transition-colors hover:bg-white/5 hover:text-white"
          >
            <LogOut size={17} />
            Terminar Sessão
          </button>
        )}
      </div>
    </aside>
  );
}
