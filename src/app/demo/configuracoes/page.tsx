import { Phone, Mail, MapPin, Clock, Scissors, MessageCircle, User, Zap } from "lucide-react";

const PERFIL = {
  nome: "Salão Demo VagasIA",
  categoria: "Salão de Beleza",
  telefone: "+351 912 345 678",
  email: "demo@vagasia.pt",
  morada: "Rua das Flores, 12 — 1200-001 Lisboa",
  whatsapp: "+351 912 345 678",
};

const SERVICOS = [
  { nome: "Corte de Cabelo",       duracao: 45,  preco: 28  },
  { nome: "Corte & Brushing",      duracao: 60,  preco: 35  },
  { nome: "Escova",                 duracao: 45,  preco: 25  },
  { nome: "Escova Progressiva",     duracao: 120, preco: 120 },
  { nome: "Coloração",              duracao: 120, preco: 65  },
  { nome: "Coloração + Mèche",      duracao: 150, preco: 90  },
  { nome: "Mèches Completas",       duracao: 120, preco: 75  },
  { nome: "Tratamento Capilar",     duracao: 60,  preco: 42  },
  { nome: "Hidratação Profunda",    duracao: 60,  preco: 38  },
  { nome: "Manicure",               duracao: 45,  preco: 22  },
  { nome: "Manicure Gel",           duracao: 60,  preco: 32  },
  { nome: "Pedicure",               duracao: 30,  preco: 28  },
  { nome: "Manicure + Pedicure",    duracao: 75,  preco: 45  },
  { nome: "Pestanas com Volume",    duracao: 90,  preco: 55  },
];

const HORARIOS = [
  { dia: "Segunda-feira",  abre: "09:00", fecha: "19:00", fechado: false },
  { dia: "Terça-feira",    abre: "09:00", fecha: "19:00", fechado: false },
  { dia: "Quarta-feira",   abre: "09:00", fecha: "19:00", fechado: false },
  { dia: "Quinta-feira",   abre: "09:00", fecha: "19:00", fechado: false },
  { dia: "Sexta-feira",    abre: "09:00", fecha: "20:00", fechado: false },
  { dia: "Sábado",         abre: "09:00", fecha: "18:00", fechado: false },
  { dia: "Domingo",        abre: "",       fecha: "",       fechado: true  },
];

const PROFISSIONAIS = [
  { nome: "Diana Garcia",    funcao: "Cabeleireira Sénior", inicial: "D" },
  { nome: "Joana Silva",     funcao: "Esteticista",          inicial: "J" },
  { nome: "Marta Ferreira",  funcao: "Manicure",             inicial: "M" },
];

const TEMPLATES = [
  {
    titulo: "Confirmação de marcação",
    mensagem: "Olá {{nome}}! A tua marcação para {{servico}} está confirmada para {{data}} às {{hora}}. Até já! 💙",
  },
  {
    titulo: "Lembrete 24h antes",
    mensagem: "Olá {{nome}}! Lembramos que tens marcação amanhã às {{hora}} para {{servico}}. Qualquer dúvida, fala connosco!",
  },
  {
    titulo: "Recuperação de vaga",
    mensagem: "Olá {{nome}}! Surgiu uma vaga disponível para {{servico}} no dia {{data}} às {{hora}}. Queres marcar? Responde SIM para reservar! 🎉",
  },
];

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-white/5 bg-[#1E293B] overflow-hidden">
      <div className="px-5 py-4 border-b border-white/5">
        <h2 className="text-sm font-semibold text-white">{title}</h2>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

export default function DemoConfiguracoesPage() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-white">Configurações</h1>
        <p className="text-sm text-slate-400 mt-0.5">Perfil e preferências do negócio</p>
      </div>

      {/* Perfil */}
      <SectionCard title="Perfil do Negócio">
        <div className="flex items-start gap-5">
          {/* Avatar */}
          <div className="shrink-0 flex flex-col items-center gap-2">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#00B4D8]/20 text-xl font-bold text-[#00B4D8] border border-[#00B4D8]/20">
              SD
            </div>
            <div className="flex items-center gap-1">
              <Zap size={9} className="text-[#2DD4BF]" fill="#2DD4BF" />
              <span className="text-[10px] text-[#2DD4BF]">VagasIA</span>
            </div>
          </div>
          {/* Fields */}
          <div className="flex-1 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {[
              { label: "Nome do negócio", value: PERFIL.nome,      icon: User     },
              { label: "Categoria",        value: PERFIL.categoria, icon: Scissors },
              { label: "Telefone",         value: PERFIL.telefone,  icon: Phone    },
              { label: "Email",            value: PERFIL.email,     icon: Mail     },
              { label: "Morada",           value: PERFIL.morada,    icon: MapPin   },
              { label: "WhatsApp",         value: PERFIL.whatsapp,  icon: MessageCircle },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="space-y-1">
                <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">{label}</p>
                <div className="flex items-center gap-2 rounded-lg border border-white/5 bg-[#0F172A] px-3 py-2">
                  <Icon size={12} className="text-slate-500 shrink-0" />
                  <p className="text-sm text-slate-300 truncate">{value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </SectionCard>

      {/* Profissionais */}
      <SectionCard title="Equipa">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {PROFISSIONAIS.map((p) => (
            <div key={p.nome} className="flex items-center gap-3 rounded-lg border border-white/5 bg-[#0F172A] px-3 py-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#00B4D8]/20 text-sm font-bold text-[#00B4D8]">
                {p.inicial}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-white truncate">{p.nome}</p>
                <p className="text-[11px] text-slate-500 truncate">{p.funcao}</p>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Serviços */}
      <SectionCard title={`Serviços (${SERVICOS.length})`}>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {SERVICOS.map((s) => (
            <div key={s.nome} className="flex items-center justify-between rounded-lg border border-white/5 bg-[#0F172A] px-3 py-2.5">
              <div className="flex items-center gap-2 min-w-0">
                <Scissors size={12} className="text-slate-600 shrink-0" />
                <p className="text-sm text-white truncate">{s.nome}</p>
              </div>
              <div className="flex items-center gap-3 shrink-0 ml-2">
                <span className="text-[11px] text-slate-500 flex items-center gap-1">
                  <Clock size={10} /> {s.duracao} min
                </span>
                <span className="text-sm font-semibold text-[#2DD4BF]">€{s.preco}</span>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Horários */}
      <SectionCard title="Horário de Funcionamento">
        <div className="space-y-2">
          {HORARIOS.map((h) => (
            <div key={h.dia} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
              <p className="text-sm text-slate-300 w-36">{h.dia}</p>
              {h.fechado ? (
                <span className="text-xs font-medium text-slate-600 bg-white/5 rounded-full px-3 py-1">Fechado</span>
              ) : (
                <div className="flex items-center gap-2 text-sm text-white">
                  <span className="font-medium text-[#00B4D8]">{h.abre}</span>
                  <span className="text-slate-600">—</span>
                  <span className="font-medium text-[#00B4D8]">{h.fecha}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </SectionCard>

      {/* WhatsApp Templates */}
      <SectionCard title="Mensagens WhatsApp Automáticas">
        <div className="space-y-4">
          {TEMPLATES.map((t) => (
            <div key={t.titulo} className="space-y-2">
              <p className="text-xs font-semibold text-slate-400">{t.titulo}</p>
              <div className="rounded-lg border border-white/5 bg-[#0F172A] px-4 py-3">
                <div className="flex items-start gap-2">
                  <MessageCircle size={13} className="text-[#25D366] shrink-0 mt-0.5" />
                  <p className="text-sm text-slate-300 leading-relaxed">{t.mensagem}</p>
                </div>
              </div>
            </div>
          ))}
          <p className="text-xs text-slate-600">
            As variáveis entre chaves (ex: {"{{nome}}"}) são substituídas automaticamente pelos dados reais de cada cliente.
          </p>
        </div>
      </SectionCard>
    </div>
  );
}
