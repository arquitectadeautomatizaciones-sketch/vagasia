import { MessageCircle, Zap } from "lucide-react";

export default function MarcarPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0F172A] px-6">
      {/* Logo */}
      <div className="flex items-center gap-2.5 mb-12">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#00B4D8]">
          <Zap size={18} className="text-white" fill="white" />
        </div>
        <span className="text-lg font-bold text-white tracking-wide">VagasIA</span>
      </div>

      {/* Card */}
      <div className="w-full max-w-md rounded-2xl border border-white/5 bg-[#1E293B] p-8 text-center shadow-2xl">
        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#00B4D8]/15">
          <MessageCircle size={28} className="text-[#00B4D8]" />
        </div>

        <h1 className="text-xl font-semibold text-white">Fazer uma Marcação</h1>

        <p className="mt-3 text-sm leading-relaxed text-slate-400">
          Para agendar o teu serviço, envia uma mensagem à nossa assistente via WhatsApp.
          Ela está disponível para te ajudar a encontrar o horário ideal.
        </p>

        <div className="my-7 border-t border-white/5" />

        <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
          WhatsApp
        </p>
        <p className="mt-2 text-2xl font-bold tracking-wide text-[#00B4D8]">
          +1 (555) 637-5786
        </p>

        <a
          href="https://wa.me/15556375786"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#00B4D8] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#0090b0]"
        >
          <MessageCircle size={16} />
          Enviar mensagem
        </a>
      </div>

      <p className="mt-8 text-xs text-slate-600">
        © {new Date().getFullYear()} VagasIA · Cabeleireira Lisboa
      </p>
    </div>
  );
}
