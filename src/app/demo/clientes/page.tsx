import { Phone, Mail, CalendarDays, TrendingUp, Search } from "lucide-react";

const CLIENTS = [
  { name: "Mariana Costa",     phone: "+351 912 345 678", email: "mariana.costa@gmail.com",    marcacoes: 24, gasto: 1240, ultimaVisita: "06 Mai 2026", initial: "M", color: "#00B4D8" },
  { name: "Ana Ferreira",      phone: "+351 934 567 890", email: "ana.ferreira@outlook.com",   marcacoes: 18, gasto: 630,  ultimaVisita: "05 Mai 2026", initial: "A", color: "#2DD4BF" },
  { name: "Beatriz Oliveira",  phone: "+351 967 891 234", email: "b.oliveira@hotmail.com",     marcacoes: 15, gasto: 480,  ultimaVisita: "04 Mai 2026", initial: "B", color: "#00B4D8" },
  { name: "Rita Fonseca",      phone: "+351 936 111 222", email: "rita.fonseca@gmail.com",     marcacoes: 12, gasto: 390,  ultimaVisita: "02 Mai 2026", initial: "R", color: "#2DD4BF" },
  { name: "Sofia Rodrigues",   phone: "+351 923 456 789", email: "sofia.r@gmail.com",          marcacoes: 11, gasto: 310,  ultimaVisita: "30 Abr 2026", initial: "S", color: "#00B4D8" },
  { name: "Catarina Lima",     phone: "+351 911 222 333", email: "catarina.lima@sapo.pt",      marcacoes: 10, gasto: 870,  ultimaVisita: "06 Mai 2026", initial: "C", color: "#2DD4BF" },
  { name: "Inês Santos",       phone: "+351 945 678 901", email: "ines.santos@gmail.com",      marcacoes: 9,  gasto: 252,  ultimaVisita: "01 Mai 2026", initial: "I", color: "#00B4D8" },
  { name: "Joana Pereira",     phone: "+351 962 345 678", email: "joana.p@outlook.com",        marcacoes: 8,  gasto: 176,  ultimaVisita: "06 Mai 2026", initial: "J", color: "#2DD4BF" },
  { name: "Leonor Carvalho",   phone: "+351 913 456 789", email: "leonor.c@gmail.com",         marcacoes: 7,  gasto: 196,  ultimaVisita: "07 Mai 2026", initial: "L", color: "#00B4D8" },
  { name: "Filipa Matos",      phone: "+351 929 876 543", email: "filipa.matos@gmail.com",     marcacoes: 7,  gasto: 595,  ultimaVisita: "07 Mai 2026", initial: "F", color: "#2DD4BF" },
  { name: "Daniela Sousa",     phone: "+351 966 543 210", email: "daniela.s@hotmail.com",      marcacoes: 6,  gasto: 192,  ultimaVisita: "07 Mai 2026", initial: "D", color: "#00B4D8" },
  { name: "Marta Pinheiro",    phone: "+351 934 321 987", email: "marta.pinheiro@gmail.com",   marcacoes: 5,  gasto: 600,  ultimaVisita: "07 Mai 2026", initial: "M", color: "#2DD4BF" },
  { name: "Raquel Teixeira",   phone: "+351 916 789 012", email: "raquel.t@sapo.pt",           marcacoes: 5,  gasto: 175,  ultimaVisita: "07 Mai 2026", initial: "R", color: "#00B4D8" },
  { name: "Cristina Neves",    phone: "+351 942 567 890", email: "cristina.n@gmail.com",       marcacoes: 4,  gasto: 300,  ultimaVisita: "07 Mai 2026", initial: "C", color: "#2DD4BF" },
  { name: "Paula Gonçalves",   phone: "+351 968 901 234", email: "paula.g@gmail.com",          marcacoes: 4,  gasto: 112,  ultimaVisita: "08 Mai 2026", initial: "P", color: "#00B4D8" },
  { name: "Susana Lopes",      phone: "+351 914 234 567", email: "susana.lopes@outlook.com",   marcacoes: 3,  gasto: 126,  ultimaVisita: "08 Mai 2026", initial: "S", color: "#2DD4BF" },
  { name: "Teresa Almeida",    phone: "+351 939 876 543", email: "teresa.a@gmail.com",         marcacoes: 3,  gasto: 135,  ultimaVisita: "08 Mai 2026", initial: "T", color: "#00B4D8" },
  { name: "Manuela Ribeiro",   phone: "+351 961 234 567", email: "m.ribeiro@hotmail.com",      marcacoes: 2,  gasto: 70,   ultimaVisita: "29 Abr 2026", initial: "M", color: "#2DD4BF" },
  { name: "Helena Martins",    phone: "+351 912 876 543", email: "helena.m@gmail.com",         marcacoes: 2,  gasto: 56,   ultimaVisita: "25 Abr 2026", initial: "H", color: "#00B4D8" },
  { name: "Francisca Cunha",   phone: "+351 935 678 901", email: "francisca.c@gmail.com",      marcacoes: 1,  gasto: 28,   ultimaVisita: "20 Abr 2026", initial: "F", color: "#2DD4BF" },
];

const totalGasto = CLIENTS.reduce((s, c) => s + c.gasto, 0);
const totalMarcacoes = CLIENTS.reduce((s, c) => s + c.marcacoes, 0);
const mediaGasto = Math.round(totalGasto / CLIENTS.length);

export default function DemoClientesPage() {
  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-white">Clientes</h1>
        <p className="text-sm text-slate-400 mt-0.5">{CLIENTS.length} clientes registadas</p>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-white/5 bg-[#1E293B] px-4 py-3">
          <p className="text-xs text-slate-500">Total de clientes</p>
          <p className="text-2xl font-bold text-white mt-1">{CLIENTS.length}</p>
        </div>
        <div className="rounded-xl border border-white/5 bg-[#1E293B] px-4 py-3">
          <p className="text-xs text-slate-500">Marcações totais</p>
          <p className="text-2xl font-bold text-[#00B4D8] mt-1">{totalMarcacoes}</p>
        </div>
        <div className="rounded-xl border border-white/5 bg-[#1E293B] px-4 py-3">
          <p className="text-xs text-slate-500">Gasto médio por cliente</p>
          <p className="text-2xl font-bold text-[#2DD4BF] mt-1">€{mediaGasto}</p>
        </div>
      </div>

      {/* Search bar (visual) */}
      <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#1E293B] px-4 py-2.5">
        <Search size={15} className="text-slate-500 shrink-0" />
        <span className="text-sm text-slate-600">Pesquisar clientes…</span>
      </div>

      {/* Clients table */}
      <div className="rounded-xl border border-white/5 bg-[#1E293B] overflow-hidden">
        <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 px-5 py-3 border-b border-white/5 bg-white/[0.02]">
          <p className="text-xs font-medium text-slate-500">Cliente</p>
          <p className="text-xs font-medium text-slate-500 w-36">Contacto</p>
          <p className="text-xs font-medium text-slate-500 w-24 text-center">Marcações</p>
          <p className="text-xs font-medium text-slate-500 w-24 text-right">Gasto total</p>
          <p className="text-xs font-medium text-slate-500 w-32 text-right">Última visita</p>
        </div>
        <div className="divide-y divide-white/5">
          {CLIENTS.map((c, i) => (
            <div key={i} className="grid grid-cols-[1fr_auto_auto_auto_auto] items-center gap-4 px-5 py-3.5 hover:bg-white/[0.02] transition-colors">
              {/* Name + avatar */}
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                  style={{ backgroundColor: c.color + "22", color: c.color }}
                >
                  {c.initial}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white truncate">{c.name}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Mail size={10} className="text-slate-600 shrink-0" />
                    <p className="text-[11px] text-slate-500 truncate">{c.email}</p>
                  </div>
                </div>
              </div>
              {/* Phone */}
              <div className="flex items-center gap-1.5 w-36">
                <Phone size={11} className="text-slate-600 shrink-0" />
                <span className="text-xs text-slate-400">{c.phone}</span>
              </div>
              {/* Appointments */}
              <div className="flex items-center justify-center gap-1.5 w-24">
                <CalendarDays size={12} className="text-slate-600" />
                <span className="text-sm font-semibold text-white">{c.marcacoes}</span>
              </div>
              {/* Spent */}
              <div className="flex items-center justify-end gap-1 w-24">
                <TrendingUp size={12} className="text-[#2DD4BF]" />
                <span className="text-sm font-semibold text-[#2DD4BF]">€{c.gasto}</span>
              </div>
              {/* Last visit */}
              <p className="text-xs text-slate-500 w-32 text-right">{c.ultimaVisita}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
