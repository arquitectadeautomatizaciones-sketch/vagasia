"use client";

import { useState } from "react";
import { Users, Check } from "lucide-react";
import TeamPanel from "./TeamPanel";
import type { Professional } from "@/lib/types";

interface Props {
  professionals: Pick<Professional, "id" | "name" | "role">[];
}

export default function DashboardTeamSection({ professionals }: Props) {
  const [open,    setOpen]    = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  // Ya hay 2 profesionales — no mostrar la card de invitación
  const hasCollaborator = professionals.length >= 2;

  // Si ya hay colaboradora, mostrar su nombre en un badge en lugar de la card
  if (hasCollaborator) {
    const collab = professionals.find((p) => p.role === "collaborator");
    if (!collab) return null;
    return (
      <div className="flex items-center gap-3 rounded-xl border border-white/5 bg-[#1E293B] px-5 py-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#2DD4BF]/10">
          <Users size={15} className="text-[#2DD4BF]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white">
            Equipa: tu + <span className="text-[#2DD4BF]">{collab.name}</span>
          </p>
          <p className="text-xs text-slate-500">
            Segundo profissional activo. Gere os seus horários em Configurações.
          </p>
        </div>
        <span className="flex items-center gap-1 rounded-full bg-[#2DD4BF]/10 px-2.5 py-1 text-xs font-medium text-[#2DD4BF]">
          <Check size={11} /> Activo
        </span>
      </div>
    );
  }

  // Estado de éxito tras enviar la invitación
  if (success) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-[#2DD4BF]/20 bg-[#2DD4BF]/5 px-5 py-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#2DD4BF]/10">
          <Check size={15} className="text-[#2DD4BF]" />
        </div>
        <div>
          <p className="text-sm font-medium text-white">
            Convite enviado para <span className="text-[#2DD4BF]">{success}</span>!
          </p>
          <p className="text-xs text-slate-400 mt-0.5">
            Assim que aceitar, a sua agenda ficará disponível aqui.
          </p>
        </div>
      </div>
    );
  }

  // Panel abierto — mostrar TeamPanel
  if (open) {
    return (
      <TeamPanel
        onClose={() => setOpen(false)}
        onSuccess={(name) => { setOpen(false); setSuccess(name); }}
      />
    );
  }

  // Card de invitación — estado inicial
  return (
    <button
      onClick={() => setOpen(true)}
      className="w-full flex items-center gap-4 rounded-xl border border-white/5 bg-[#1E293B] px-5 py-4 text-left transition-colors hover:border-[#00B4D8]/30 hover:bg-[#1E293B]/80 group"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#00B4D8]/10 group-hover:bg-[#00B4D8]/20 transition-colors">
        <Users size={18} className="text-[#00B4D8]" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white">
          Tens um colaborador?{" "}
          <span className="text-[#00B4D8]">
            Configura a agenda do teu segundo profissional aqui.
          </span>
        </p>
        <p className="text-xs text-slate-500 mt-0.5">
          Até 2 profissionais por local · 1 número WhatsApp partilhado
        </p>
      </div>
      <span className="shrink-0 text-xs text-[#00B4D8] font-medium opacity-0 group-hover:opacity-100 transition-opacity">
        Configurar →
      </span>
    </button>
  );
}
