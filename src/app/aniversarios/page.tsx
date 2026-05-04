"use client";

import { useState, useEffect } from "react";
import AppLayout from "@/components/AppLayout";
import type { Client } from "@/lib/types";
import { Cake, Phone, Mail, Loader2 } from "lucide-react";

type BirthdayPeriod = "hoje" | "semana" | "mes";

interface BirthdayClient extends Client {
  period: BirthdayPeriod;
  diasRestantes: number;
}

function classifyBirthday(dataNascimento: string): { period: BirthdayPeriod | null; dias: number } {
  const today = new Date();
  const todayNorm = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const [, month, day] = dataNascimento.split("-").map(Number);
  const thisYear = new Date(today.getFullYear(), month - 1, day);
  const dias = Math.round((thisYear.getTime() - todayNorm.getTime()) / 86_400_000);

  if (dias === 0) return { period: "hoje", dias: 0 };
  if (dias > 0 && dias <= 7) return { period: "semana", dias };
  if (dias > 7 && month - 1 === today.getMonth()) return { period: "mes", dias };
  return { period: null, dias };
}

function formatBirthday(dataNascimento: string): string {
  const [, month, day] = dataNascimento.split("-").map(Number);
  return new Date(2000, month - 1, day).toLocaleDateString("pt-PT", { day: "numeric", month: "long" });
}

function BirthdayCard({ client }: { client: BirthdayClient }) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-white/5 bg-[#1E293B] px-5 py-4 transition-colors hover:border-white/10">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#00B4D8]/20 text-sm font-semibold text-[#00B4D8]">
        {client.name.charAt(0)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-medium text-white">{client.name}</p>
          {client.period === "hoje" && (
            <span className="inline-flex items-center gap-1 rounded-full bg-[#2DD4BF]/15 px-2 py-0.5 text-[10px] font-semibold text-[#2DD4BF]">
              <Cake size={10} /> Hoje!
            </span>
          )}
        </div>
        <p className="text-xs text-[#00B4D8] mt-0.5">{formatBirthday(client.data_nascimento!)}</p>
        <div className="mt-1.5 flex flex-wrap gap-3">
          <span className="flex items-center gap-1 text-[11px] text-slate-500">
            <Phone size={10} /> {client.phone}
          </span>
          {client.email && (
            <span className="flex items-center gap-1 text-[11px] text-slate-500">
              <Mail size={10} /> {client.email}
            </span>
          )}
        </div>
      </div>
      {client.period !== "hoje" && (
        <div className="text-right shrink-0">
          <p className="text-xl font-bold text-[#00B4D8]">{client.diasRestantes}</p>
          <p className="text-[10px] text-slate-500 mt-0.5">dias</p>
        </div>
      )}
    </div>
  );
}

function Section({
  title,
  accent,
  clients,
  empty,
}: {
  title: string;
  accent: string;
  clients: BirthdayClient[];
  empty: string;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className={`h-1 w-1 rounded-full ${accent}`} />
        <h2 className="text-sm font-semibold text-white">{title}</h2>
        <span className="rounded-full bg-white/5 px-2 py-0.5 text-xs text-slate-400">{clients.length}</span>
      </div>
      {clients.length === 0 ? (
        <div className="rounded-xl border border-white/5 bg-[#1E293B] px-5 py-6 text-center text-sm text-slate-600">
          {empty}
        </div>
      ) : (
        <div className="space-y-2">
          {clients.map((c) => (
            <BirthdayCard key={c.id} client={c} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function AniversariosPage() {
  const [birthdayClients, setBirthdayClients] = useState<BirthdayClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/clients")
      .then((r) => r.json())
      .then((data: Client[]) => {
        if (!Array.isArray(data)) { setError("Erro ao carregar clientes."); return; }
        const result = data
          .filter((c) => c.data_nascimento)
          .map((c) => {
            const { period, dias } = classifyBirthday(c.data_nascimento!);
            return period ? { ...c, period, diasRestantes: dias } : null;
          })
          .filter(Boolean) as BirthdayClient[];
        setBirthdayClients(result);
      })
      .catch(() => setError("Erro ao carregar clientes."))
      .finally(() => setLoading(false));
  }, []);

  const hoje = birthdayClients.filter((c) => c.period === "hoje");
  const semana = birthdayClients.filter((c) => c.period === "semana").sort((a, b) => a.diasRestantes - b.diasRestantes);
  const mes = birthdayClients.filter((c) => c.period === "mes").sort((a, b) => a.diasRestantes - b.diasRestantes);

  const dataHoje = new Date().toLocaleDateString("pt-PT", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-semibold text-white">Aniversários</h1>
            <p className="text-sm text-slate-400 mt-0.5 capitalize">{dataHoje}</p>
          </div>
          {!loading && (
            <div className="rounded-xl border border-white/5 bg-[#1E293B] px-4 py-2 text-center">
              <p className="text-lg font-bold text-[#2DD4BF]">{birthdayClients.length}</p>
              <p className="text-[10px] text-slate-500">este mês</p>
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 size={24} className="animate-spin text-slate-600" />
          </div>
        ) : error ? (
          <div className="py-16 text-center text-sm text-red-400">{error}</div>
        ) : (
          <div className="space-y-8">
            <Section
              title="Hoje"
              accent="bg-[#2DD4BF]"
              clients={hoje}
              empty="Nenhum aniversário hoje."
            />
            <Section
              title="Esta Semana"
              accent="bg-[#00B4D8]"
              clients={semana}
              empty="Nenhum aniversário esta semana."
            />
            <Section
              title="Este Mês"
              accent="bg-slate-600"
              clients={mes}
              empty="Nenhum aniversário este mês."
            />
          </div>
        )}
      </div>
    </AppLayout>
  );
}
