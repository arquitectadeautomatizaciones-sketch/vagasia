"use client";

import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Bot } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const WELCOME: Message = {
  role: "assistant",
  content:
    "Olá! Sou a tua assistente VagasIA. Como posso ajudar-te hoje? Podes perguntar-me sobre marcações, clientes, fidelização, financeiro ou qualquer outra funcionalidade.",
};

const QUICK_QUESTIONS = [
  "Como adiciono um cliente?",
  "Como publico uma vaga?",
  "Como funciona a fidelização?",
  "Como vejo as minhas finanças?",
];

export default function SupportBot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

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
            content: "Desculpa, ocorreu um erro. Tenta novamente ou envia email para suporte@vagasia.pt.",
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
          content: "Desculpa, ocorreu um erro de ligação. Verifica a tua internet e tenta novamente.",
        };
        return updated;
      });
    } finally {
      setLoading(false);
    }
  }

  const showQuickQuestions =
    messages.length === 1 && messages[0].role === "assistant";

  return (
    <>
      {/* Chat panel */}
      {open && (
        <div
          className="fixed bottom-20 right-4 z-50 flex flex-col rounded-2xl border border-white/10 bg-[#0F172A] shadow-2xl"
          style={{ width: 360, maxHeight: 520 }}
        >
          {/* Header */}
          <div className="flex items-center gap-3 rounded-t-2xl bg-[#00B4D8] px-4 py-3.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/20">
              <Bot size={16} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white leading-tight">Assistente VagasIA</p>
              <p className="text-[11px] text-white/70 leading-tight">Sempre disponível para ajudar</p>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="rounded-lg p-1 text-white/70 hover:bg-white/10 hover:text-white transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ minHeight: 0 }}>
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex gap-2 ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {m.role === "assistant" && (
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#00B4D8]/20 mt-0.5">
                    <Bot size={12} className="text-[#00B4D8]" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
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
          <div className="border-t border-white/5 p-3">
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
                className="flex-1 rounded-xl bg-[#1E293B] px-3.5 py-2.5 text-sm text-white placeholder-slate-600 outline-none focus:ring-1 focus:ring-[#00B4D8]/50 disabled:opacity-50 transition-all"
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
      )}

      {/* Floating button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-4 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#00B4D8] text-white shadow-lg hover:bg-[#0090b0] transition-colors"
        aria-label="Abrir assistente VagasIA"
      >
        {open ? <X size={22} /> : <MessageCircle size={22} />}
      </button>
    </>
  );
}
