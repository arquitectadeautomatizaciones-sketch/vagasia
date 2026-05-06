import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import { ArrowRight } from "lucide-react";

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0F172A]">
      <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between gap-4 bg-[#00B4D8] px-5 py-2.5">
        <p className="text-sm font-medium text-white">
          Estás a ver uma demonstração do VagasIA.
        </p>
        <Link
          href="/register"
          className="flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-[#00B4D8] hover:bg-[#e0f7ff] transition-colors shrink-0"
        >
          Cria a tua conta grátis <ArrowRight size={12} />
        </Link>
      </div>
      <div className="flex h-screen pt-[44px]">
        <div className="shrink-0">
          <Sidebar demoBusinessName="Salão Demo VagasIA" demoLogoInitials="SD" />
        </div>
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
