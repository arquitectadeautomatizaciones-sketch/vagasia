"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { X, Send } from "lucide-react";
import { createSupabaseBrowserClient } from "@/utils/supabase/client";

const SOFIA_AVATAR =
  "https://assets.cdn.filesafe.space/MgsViYLMmCdJksx9p3va/media/69e8ba57a1636a6c65273241.png";

// Clave de localStorage para el mensaje de bienvenida del onboarding (Mensaje A)
const LS_ONBOARDING_KEY = "sofia_onboarding_welcome";
// Clave de localStorage para la bienvenida de primera entrada al dashboard
const LS_WELCOME_KEY = "sofia_welcome_shown";

const TRIAL_DAYS = 7;

interface Message {
  role: "user" | "assistant";
  content: string;
}

// ── Mensaje B: bienvenida normal al abrir el chat ────────────────────────────
const WELCOME_DEFAULT: Message = {
  role: "assistant",
  content: "Olá! Sou a Sofía 💚 Como posso ajudar-te hoje?",
};

// ── Demo ──────────────────────────────────────────────────────────────────────
const DEMO_WELCOME: Message = {
  role: "assistant",
  content:
    "Olá! 👋 Estás a explorar o VagasIA. Tens alguma dúvida sobre o que estás a ver? Estou aqui para explicar tudo! 😊",
};

// ── Mensaje A: solo al terminar el onboarding, con el nombre real ─────────────
function makeOnboardingWelcome(name: string): Message {
  return {
    role: "assistant",
    content:
      `Olá ${name}! 🎉 Bem-vindo/a à família VagasIA!\n\n` +
      `Obrigada pela confiança que depositaste em nós — é com muito orgulho que te recebemos.\n\n` +
      `Sou a Sofía, da equipa de apoio ao cliente da VagasIA 💚 Estou aqui para te ajudar com qualquer dúvida — marcações, clientes, fidelização, financeiro ou qualquer outra funcionalidade.\n\n` +
      `Sempre que precisares de ajuda ou tiveres dificuldade a gerir a tua app, volta aqui a qualquer hora. Alguém da nossa equipa estará sempre disponível para te ajudar de imediato.\n\n` +
      `Estamos muito felizes por teres dado este passo. Vamos juntos fazer o teu negócio crescer! 💪\n\n` +
      `Como posso ajudar-te hoje?`,
  };
}

const QUICK_QUESTIONS = [
  "Como adiciono um cliente?",
  "Como publico uma vaga?",
  "Como funciona a fidelização?",
  "Como vejo as minhas finanças?",
];

// Páginas donde la Sofía NO debe aparecer
const HIDDEN_PATHS = ["/login", "/register", "/onboarding"];

export default function SupportBot() {
  const pathname = usePathname();

  // Ocultar en páginas públicas / onboarding
  const isHidden =
    HIDDEN_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([WELCOME_DEFAULT]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const autoOpenTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  // Auto-open logic based on route
  useEffect(() => {
    if (autoOpenTimerRef.current) {
      clearTimeout(autoOpenTimerRef.current);
      autoOpenTimerRef.current = null;
    }

    let cancelled = false;

    if (pathname.startsWith("/demo")) {
      // Demo: abre tras 5 s con mensaje de demo
      setOpen(false);
      setMessages([DEMO_WELCOME]);
      autoOpenTimerRef.current = setTimeout(() => {
        if (!cancelled) setOpen(true);
      }, 5000);

    } else if (pathname === "/onboarding") {
      // Onboarding done: leer localStorage para el Mensaje A (solo una vez)
      const raw = typeof window !== "undefined"
        ? localStorage.getItem(LS_ONBOARDING_KEY)
        : null;
      if (raw) {
        try {
          const { name, shown } = JSON.parse(raw) as { name: string; shown: boolean };
          if (!shown && name) {
            setMessages([makeOnboardingWelcome(name)]);
            autoOpenTimerRef.current = setTimeout(() => {
              if (cancelled) return;
              setOpen(true);
              // Marcar como mostrado para no repetir
              localStorage.setItem(LS_ONBOARDING_KEY, JSON.stringify({ name, shown: true }));
            }, 1500);
          }
        } catch {
          // JSON malformado — ignorar
        }
      }

    } else if (pathname === "/dashboard") {
      // Dashboard: abrir solo la PRIMERA vez que el cliente entra (uma vez por conta)
      const alreadyShown = typeof window !== "undefined"
        ? localStorage.getItem(LS_WELCOME_KEY) === "true"
        : true;

      if (!alreadyShown) {
        createSupabaseBrowserClient()
          .auth.getUser()
          .then(({ data: { user } }) => {
            if (cancelled) return;
            const trialStartedAt = user?.app_metadata?.trial_started_at as string | undefined;
            const inTrial =
              !!trialStartedAt &&
              Date.now() - new Date(trialStartedAt).getTime() <
                TRIAL_DAYS * 24 * 60 * 60 * 1000;

            if (inTrial) {
              // Obtener nombre del negocio para personalizar el mensaje
              const businessName =
                (user?.app_metadata?.business_name as string | undefined) ?? "";
              const firstName = businessName.split(" ")[0] || "";
              const welcomeMsg: Message = {
                role: "assistant",
                content:
                  `Olá${firstName ? ` ${firstName}` : ""}! 👋 Bem-vinda ao VagasIA!\n\n` +
                  `Sou a Sofía, da equipa de apoio ao cliente. Estou aqui para te ajudar a tirar o máximo partido do sistema nos teus 7 dias de experiência gratuita.\n\n` +
                  `Se tiveres alguma dúvida sobre como funciona algo — marcações, lembretes, a lista de espera, o que for — é só perguntar.\n\n` +
                  `Estou sempre aqui! 💚`,
              };
              setMessages([welcomeMsg]);
              autoOpenTimerRef.current = setTimeout(() => {
                if (cancelled) return;
                setOpen(true);
                localStorage.setItem(LS_WELCOME_KEY, "true");
              }, 5000);
            }
          });
      }
    }

    return () => {
      cancelled = true;
      if (autoOpenTimerRef.current) {
        clearTimeout(autoOpenTimerRef.current);
        autoOpenTimerRef.current = null;
      }
    };
  }, [pathname]);

  async function send(content: string) {
    if (!content.trim() || loading) return;

    const userMsg: Message = { role: "user", content: content.trim() };
    const history = [...messages, userMsg];
    setMessages(history);
    setInput("");
    setLoading(true);

    const assistantMsg: Message = { role: "assistant", content: "" };
    setMessages([...history, assistantMsg]);

    try {
      const apiMessages = history
        .filter((m) => m.role === "user" || (m.role === "assistant" && m.content))
        .map((m) => ({ role: m.role, content: m.content }));

      const res = await fetch("/api/support-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMessages }),
      });

      if (!res.ok || !res.body) {
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: "assistant",
            content:
              "Desculpa, ocorreu um erro. Tenta novamente ou envia email para geral@dianagarcia.pt.",
          };
          return updated;
        });
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let full = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        for (const line of chunk.split("\n")) {
          if (!line.startsWith("data: ")) continue;
          const raw = line.slice(6).trim();
          if (raw === "[DONE]") continue;
          try {
            const { delta } = JSON.parse(raw);
            full += delta;
            setMessages((prev) => {
              const updated = [...prev];
              updated[updated.length - 1] = { role: "assistant", content: full };
              return updated;
            });
          } catch {
            // skip malformed SSE line
          }
        }
      }
    } catch {
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: "assistant",
          content:
            "Desculpa, ocorreu um erro de ligação. Verifica a tua internet e tenta novamente.",
        };
        return updated;
      });
    } finally {
      setLoading(false);
    }
  }

  const showQuickQuestions =
    messages.length === 1 && messages[0].role === "assistant";

  if (isHidden) return null;

  return (
    <>
      {/* ── Panel del chat ─────────────────────────────────────────────────── */}
      <div
        aria-hidden={!open}
        className={[
          // Posición y z-index
          "fixed bottom-20 right-2 sm:right-4 z-50",
          // Tamaño: compacto en móvil, más grande en desktop
          "w-[min(320px,calc(100vw-16px))] sm:w-[360px]",
          "max-h-[420px] sm:max-h-[520px]",
          // Estructura
          "flex flex-col",
          // Aspecto
          "rounded-2xl border border-white/10 bg-[#0F172A] shadow-2xl",
          // Animación de apertura/cierre
          "transition duration-300 ease-out origin-bottom-right",
          open
            ? "opacity-100 scale-100 pointer-events-auto"
            : "opacity-0 scale-95 pointer-events-none",
        ].join(" ")}
      >
        {/* Header */}
        <div className="flex items-center gap-3 rounded-t-2xl bg-[#4ECDC4] px-4 py-3 shrink-0">
          <Image
            src={SOFIA_AVATAR}
            alt="Sofía"
            width={36}
            height={36}
            className="h-9 w-9 shrink-0 rounded-full object-cover ring-2 ring-white/30"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white leading-tight">Sofía</p>
            <p className="text-[11px] text-white/70 leading-tight">Assistente VagasIA</p>
          </div>
          {/* X grande y visible */}
          <button
            onClick={() => setOpen(false)}
            className="rounded-lg p-2 text-white/80 hover:bg-white/20 hover:text-white transition-colors"
            aria-label="Fechar chat"
          >
            <X size={20} strokeWidth={2.5} />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 min-h-0">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`flex gap-2 ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {m.role === "assistant" && (
                <Image
                  src={SOFIA_AVATAR}
                  alt="Sofía"
                  width={24}
                  height={24}
                  className="h-6 w-6 shrink-0 rounded-full object-cover mt-0.5"
                />
              )}
              <div
                className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap ${
                  m.role === "user"
                    ? "bg-[#00B4D8] text-white rounded-tr-sm"
                    : "bg-[#1E293B] text-slate-200 rounded-tl-sm"
                }`}
              >
                {m.content || (
                  <span className="flex items-center gap-1 text-slate-500">
                    <span className="inline-block h-1.5 w-1.5 animate-bounce rounded-full bg-slate-500 [animation-delay:0ms]" />
                    <span className="inline-block h-1.5 w-1.5 animate-bounce rounded-full bg-slate-500 [animation-delay:150ms]" />
                    <span className="inline-block h-1.5 w-1.5 animate-bounce rounded-full bg-slate-500 [animation-delay:300ms]" />
                  </span>
                )}
              </div>
            </div>
          ))}

          {/* Quick question chips */}
          {showQuickQuestions && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {QUICK_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => send(q)}
                  className="rounded-full border border-[#00B4D8]/30 bg-[#00B4D8]/10 px-3 py-1.5 text-xs text-[#00B4D8] hover:bg-[#00B4D8]/20 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t border-white/5 p-3 shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="flex items-center gap-2"
          >
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Escreve a tua pergunta…"
              disabled={loading}
              className="flex-1 rounded-xl bg-[#1E293B] px-3 py-2 text-sm text-white placeholder-slate-600 outline-none focus:ring-1 focus:ring-[#00B4D8]/50 disabled:opacity-50 transition-all"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#00B4D8] text-white hover:bg-[#0090b0] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <Send size={15} />
            </button>
          </form>
        </div>
      </div>

      {/* ── Botón flotante ─────────────────────────────────────────────────── */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-4 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#00B4D8] shadow-lg hover:bg-[#0090b0] transition-colors overflow-hidden"
        aria-label="Abrir assistente Sofía"
      >
        {open ? (
          <X size={22} className="text-white" />
        ) : (
          <Image
            src={SOFIA_AVATAR}
            alt="Sofía"
            width={56}
            height={56}
            className="h-14 w-14 object-cover"
          />
        )}
      </button>
    </>
  );
}
