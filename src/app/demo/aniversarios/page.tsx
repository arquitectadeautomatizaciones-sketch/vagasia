import { Cake, Phone, MessageCircle } from "lucide-react";

const HOJE = [
  { name: "Rita Fonseca",     phone: "+351 936 111 222", anos: 34, initial: "R" },
  { name: "Daniela Sousa",    phone: "+351 966 543 210", anos: 28, initial: "D" },
];

const ESTA_SEMANA = [
  { name: "Sofia Rodrigues",  phone: "+351 923 456 789", dias: 2,  data: "8 Mai",  initial: "S" },
  { name: "Inês Santos",      phone: "+351 945 678 901", dias: 4,  data: "10 Mai", initial: "I" },
  { name: "Marta Pinheiro",   phone: "+351 934 321 987", dias: 5,  data: "11 Mai", initial: "M" },
  { name: "Catarina Lima",    phone: "+351 911 222 333", dias: 6,  data: "12 Mai", initial: "C" },
];

const ESTE_MES = [
  { name: "Ana Ferreira",     phone: "+351 934 567 890", data: "14 Mai", initial: "A" },
  { name: "Filipa Matos",     phone: "+351 929 876 543", data: "16 Mai", initial: "F" },
  { name: "Leonor Carvalho",  phone: "+351 913 456 789", data: "18 Mai", initial: "L" },
  { name: "Mariana Costa",    phone: "+351 912 345 678", data: "19 Mai", initial: "M" },
  { name: "Joana Pereira",    phone: "+351 962 345 678", data: "21 Mai", initial: "J" },
  { name: "Beatriz Oliveira", phone: "+351 967 891 234", data: "22 Mai", initial: "B" },
  { name: "Raquel Teixeira",  phone: "+351 916 789 012", data: "24 Mai", initial: "R" },
  { name: "Paula Gonçalves",  phone: "+351 968 901 234", data: "25 Mai", initial: "P" },
  { name: "Teresa Almeida",   phone: "+351 939 876 543", data: "27 Mai", initial: "T" },
  { name: "Susana Lopes",     phone: "+351 914 234 567", data: "29 Mai", initial: "S" },
  { name: "Helena Martins",   phone: "+351 912 876 543", data: "30 Mai", initial: "H" },
];

function Avatar({ initial, teal }: { initial: string; teal?: boolean }) {
  return (
    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold ${teal ? "bg-[#2DD4BF]/20 text-[#2DD4BF]" : "bg-[#00B4D8]/15 text-[#00B4D8]"}`}>
      {initial}
    </div>
  );
}

export default function DemoAniversariosPage() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-white">Aniversários</h1>
        <p className="text-sm text-slate-400 mt-0.5">{HOJE.length + ESTA_SEMANA.length + ESTE_MES.length} aniversários em maio</p>
      </div>

      {/* Hoje */}
      <div className="rounded-xl border border-[#2DD4BF]/25 bg-[#1E293B] overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-[#2DD4BF]/15 bg-[#2DD4BF]/5">
          <Cake size={15} className="text-[#2DD4BF]" />
          <h2 className="text-sm font-semibold text-[#2DD4BF]">Hoje · 6 de maio</h2>
          <span className="ml-auto rounded-full bg-[#2DD4BF]/20 px-2 py-0.5 text-[11px] font-semibold text-[#2DD4BF]">{HOJE.length}</span>
        </div>
        <div className="divide-y divide-white/5">
          {HOJE.map((b) => (
            <div key={b.name} className="flex items-center gap-4 px-5 py-4">
              <Avatar initial={b.initial} teal />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white">{b.name}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Phone size={10} className="text-slate-600" />
                  <span className="text-xs text-slate-500">{b.phone}</span>
                  <span className="text-[11px] text-[#2DD4BF] font-medium">· {b.anos} anos hoje!</span>
                </div>
              </div>
              <button className="flex items-center gap-1.5 rounded-lg bg-[#25D366]/15 px-3 py-1.5 text-xs font-medium text-[#25D366]">
                <MessageCircle size={12} />
                Enviar parabéns
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Esta semana */}
      <div className="rounded-xl border border-white/5 bg-[#1E293B] overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-white/5">
          <Cake size={15} className="text-[#00B4D8]" />
          <h2 className="text-sm font-semibold text-white">Esta semana</h2>
          <span className="ml-auto text-xs text-slate-500">{ESTA_SEMANA.length} clientes</span>
        </div>
        <div className="divide-y divide-white/5">
          {ESTA_SEMANA.map((b) => (
            <div key={b.name} className="flex items-center gap-4 px-5 py-3.5">
              <Avatar initial={b.initial} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white">{b.name}</p>
                <p className="text-xs text-slate-500 mt-0.5">{b.phone}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs font-semibold text-[#00B4D8]">{b.data}</p>
                <p className="text-[11px] text-slate-500">em {b.dias} dias</p>
              </div>
              <button className="flex items-center gap-1.5 rounded-lg bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-white hover:bg-white/10 transition-colors">
                <MessageCircle size={12} />
                Enviar
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Este mês */}
      <div className="rounded-xl border border-white/5 bg-[#1E293B] overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-white/5">
          <Cake size={15} className="text-slate-500" />
          <h2 className="text-sm font-semibold text-white">Resto do mês</h2>
          <span className="ml-auto text-xs text-slate-500">{ESTE_MES.length} clientes</span>
        </div>
        <div className="divide-y divide-white/5">
          {ESTE_MES.map((b) => (
            <div key={b.name} className="flex items-center gap-4 px-5 py-3">
              <Avatar initial={b.initial} />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white">{b.name}</p>
              </div>
              <p className="text-xs text-slate-500 shrink-0">{b.data}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
