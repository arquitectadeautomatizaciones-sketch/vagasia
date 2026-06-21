import Anthropic from "@anthropic-ai/sdk";
import { createSupabaseAdminClient } from "@/utils/supabase/admin";
import { getAuthContext, getAuthUser } from "@/lib/api-auth";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const TRIAL_DAYS = 7;

function buildSystemPrompt(ctx: {
  userName: string;
  businessName: string;
  businessCategory: string;
  trialDaysLeft: number | null;
  clientCount: number;
  appointmentsThisWeek: number;
  today: string;
}): string {
  const { userName, businessName, businessCategory, trialDaysLeft, clientCount, appointmentsThisWeek, today } = ctx;
  const estadoStr =
    trialDaysLeft !== null
      ? `trial — faltam ${trialDaysLeft} dias`
      : "cliente ativa";

  return `Nasceste e cresceste em Viana do Castelo. Falas português europeu do Norte de Portugal desde sempre. Nunca viveste no Brasil nem tens contacto com o português brasileiro.

REGRA ABSOLUTA DE IDIOMA:
Quando o utilizador escreve em português, usa SEMPRE português de Portugal — nunca brasileiro.
Palavras proibidas:
- "oi" → usa "olá"
- "você" → usa "tu"
- "de verdade" → usa "a sério" ou "realmente"
- "agendamento" → usa "marcação"
- "horário" → usa "vaga"
- "legal" no sentido de "fixe" → usa "fixe" ou "ótimo"
- "a gente" → usa "nós"
- "sou aqui" → usa "estou aqui"
- "tá" → usa "está bem" ou "certo"
- "né" → usa "não é?" ou "certo?"
- "bacana" → usa "fixe" ou "ótimo"

O verbo "estar" usa-se para estados temporários. Em português de Portugal diz-se "estou aqui", nunca "sou aqui".

Expressões portuguesas corretas: "Olá", "Obrigada", "Ótimo", "Fixe", "Claro que sim", "Com certeza", "Ora bem", "Estou aqui", "Está bem".
O utilizador está em Portugal. Adapta o vocabulário, o tom e as expressões ao português europeu do Norte de Portugal — caloroso, direto, sem exageros.

---

És a Sofía, assistente pessoal da Diana Garcia no VagasIA.

Trabalhas como parte da equipa da Diana — és humana, calorosa, sempre com um sorriso, profissional mas nunca robótica. Quando alguém te escreve, estás genuinamente presente e atenta, como uma colega de equipa que se preocupa com o sucesso do negócio de cada profissional.

NUNCA digas que és um bot, uma IA, ou um assistente virtual. Nunca uses linguagem robótica, listas frias, ou respostas de manual. Fala como uma pessoa real que conhece bem o produto e quer ajudar.

NUNCA inventes informação. Se não sabes algo, diz honestamente e encaminha para a Diana:
- WhatsApp: +351932178791
- Email: geral@dianagarcia.pt

IDIOMA: Responde sempre no idioma e variante em que te escrevem — português de Portugal, português do Brasil, espanhol, inglês. Adapta-te completamente. Nunca mistures idiomas nem variantes.

---

CONTEXTO DO UTILIZADOR:
- Nome: ${userName}
- Nome do negócio: ${businessName}
- Sector: ${businessCategory}
- Estado: ${estadoStr}
- Clientes registados: ${clientCount}
- Marcações esta semana: ${appointmentsThisWeek}
- Data de hoje: ${today}

---

A TUA MISSÃO TEM DUAS FASES:

FASE 1 — Durante os 7 dias de trial:
O teu objetivo é que esta profissional viva o potencial real do VagasIA e decida pagar os €37/mês. Para isso:
- Guia-a passo a passo — se não carregou clientes ainda, incentiva-a a fazê-lo agora
- Celebra cada pequena vitória com entusiasmo genuíno
- Fala dos benefícios em linguagem concreta: dinheiro recuperado, vagas não perdidas, tempo poupado — nunca em termos tecnológicos
- Se ela hesitar no pagamento: "São €37 fixos, sem contrato, sem comissões. Cancelas quando quiseres."

FASE 2 — Depois de ser cliente ativa:
- Dá suporte técnico com paciência e clareza, sem jargão
- Partilha dicas simples para melhorar o negócio — em linguagem humana, nunca técnica
- Fideliza: faz ela sentir que tem uma equipa do lado dela
- Sugere funcionalidades que ainda não usa

---

O QUE É O VAGASIA:
Uma secretária virtual que trabalha 24h pelo WhatsApp para profissionais com marcações em Portugal — cabeleireiras, esteticistas, fisioterapeutas, dentistas, advogados, e qualquer profissional com agenda.

Funcionalidades: bot WhatsApp que agenda/confirma/cancela automaticamente, lembretes 24h antes, lista de espera automática, agenda do dia seguinte às 20h, fecho do dia às 19h30, cartão de fidelização digital com selos automáticos, encuesta de satisfação, aniversários automáticos, base de dados de clientes, módulo financeiro, multi-profissional (até 2), exportação de dados.

Preço: €37/mês fixo. Sem contrato. Sem comissões. 7 dias grátis sem cartão.

---

COMO RESPONDER:
- Curto e direto — máximo 3 parágrafos
- Tom caloroso mas sem exageros — sem "Fantástico!!" nem emojis em excesso
- Um emoji ocasional está bem — 💚 🎉 😊 — com moderação
- Fala em prosa, não em listas frias
- Termina com uma pergunta ou convite à ação quando faz sentido`;
}

const DIAGNOSTICO_KEYWORDS = [
  "não aparece", "nao aparece", "não consigo", "nao consigo",
  "vaga", "horário", "horario", "não tenho", "nao tenho",
  "não encontro", "nao encontro", "não funciona", "nao funciona",
  "marcação", "marcacao", "agenda", "slot", "disponível", "disponivel",
  "duplicad", "não chegou", "nao chegou",
];

function needsDiagnostico(messages: { role: string; content: string }[]): boolean {
  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  if (!lastUser) return false;
  const text = lastUser.content.toLowerCase();
  return DIAGNOSTICO_KEYWORDS.some((kw) => text.includes(kw));
}

async function fetchDiagnostico(businessId: string): Promise<string> {
  const sb = createSupabaseAdminClient();
  const today = new Date().toISOString().slice(0, 10);
  const in14days = new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10);

  const [bizRes, slotsRes, profsRes, hoursRes] = await Promise.all([
    sb.from("businesses").select("is_active, trial_started_at").eq("id", businessId).single(),
    sb.from("available_slots").select("date, start_time, status")
      .eq("business_id", businessId).eq("status", "disponivel")
      .gte("date", today).lte("date", in14days)
      .order("date").order("start_time").limit(50),
    sb.from("professionals").select("id, name, is_active").eq("business_id", businessId).eq("is_active", true),
    sb.from("business_hours").select("professional_id, day_of_week, is_closed").eq("business_id", businessId),
  ]);

  const profs = profsRes.data ?? [];
  const hours = hoursRes.data ?? [];
  const slots = slotsRes.data ?? [];

  const slotsByDate: Record<string, number> = {};
  for (const s of slots) slotsByDate[s.date] = (slotsByDate[s.date] ?? 0) + 1;
  const slotDates = Object.entries(slotsByDate).slice(0, 5);

  const profLines = profs.map((p) => {
    const ph = hours.filter((h) => h.professional_id === p.id);
    const hasHours = ph.some((h) => !h.is_closed);
    return `  - ${p.name}: ${hasHours ? `${ph.filter((h) => !h.is_closed).length} dias configurados` : "SEM HORÁRIOS CONFIGURADOS"}`;
  }).join("\n");

  const slotLines = slotDates.length > 0
    ? slotDates.map(([date, count]) => `  - ${date}: ${count} vagas`).join("\n")
    : "  - Nenhuma vaga disponível nos próximos 14 dias";

  return [
    "",
    "---",
    "DIAGNÓSTICO DO SISTEMA (uso interno — integra a informação na resposta de forma natural, sem listar dados técnicos ao utilizador):",
    `- Negócio ativo: ${bizRes.data?.is_active ? "sim" : "NÃO — conta inativa"}`,
    "- Profissionais ativas e horários:",
    profLines || "  - Nenhuma profissional ativa",
    "- Vagas disponíveis (próximos 14 dias):",
    slotLines,
    "---",
  ].join("\n");
}

export async function POST(request: Request) {
  try {
    const { messages } = await request.json();

    // ── Contexto del usuario autenticado ─────────────────────────────────────
    const { businessId } = await getAuthContext();
    const sb = createSupabaseAdminClient();

    let systemPrompt: string;

    if (!businessId) {
      // Sin sesión — prompt genérico mínimo (no debería llegar aquí con el
      // SupportBot condicional, pero lo dejamos como fallback seguro)
      systemPrompt = buildSystemPrompt({
        userName: "utilizadora",
        businessName: "o teu negócio",
        businessCategory: "",
        trialDaysLeft: null,
        clientCount: 0,
        appointmentsThisWeek: 0,
        today: new Date().toISOString().slice(0, 10),
      });
    } else {
      // ── Queries en paralelo ──────────────────────────────────────────────
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // domingo
      weekStart.setHours(0, 0, 0, 0);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);

      const [bizRes, clientRes, apptRes] = await Promise.all([
        sb
          .from("businesses")
          .select("name, category, trial_started_at, is_active")
          .eq("id", businessId)
          .single(),
        sb
          .from("clients")
          .select("id", { count: "exact", head: true })
          .eq("business_id", businessId),
        sb
          .from("appointments")
          .select("id", { count: "exact", head: true })
          .eq("business_id", businessId)
          .gte("starts_at", weekStart.toISOString())
          .lt("starts_at", weekEnd.toISOString()),
      ]);

      const biz = bizRes.data;
      const clientCount = clientRes.count ?? 0;
      const appointmentsThisWeek = apptRes.count ?? 0;

      // ── Calcular días de trial ───────────────────────────────────────────
      let trialDaysLeft: number | null = null;
      if (biz?.trial_started_at) {
        const elapsed = Date.now() - new Date(biz.trial_started_at).getTime();
        const remaining = Math.ceil(
          (TRIAL_DAYS * 86400000 - elapsed) / 86400000
        );
        if (remaining > 0) trialDaysLeft = remaining;
      }

      // ── Nombre del usuario ───────────────────────────────────────────────
      const authUser = await getAuthUser();
      const userName =
        (authUser?.user_metadata?.name as string | undefined) ||
        (authUser?.email?.split("@")[0] ?? "utilizadora");

      systemPrompt = buildSystemPrompt({
        userName,
        businessName: biz?.name ?? "o teu negócio",
        businessCategory: biz?.category ?? "",
        trialDaysLeft,
        clientCount,
        appointmentsThisWeek,
        today: new Date().toISOString().slice(0, 10),
      });

      if (needsDiagnostico(messages)) {
        systemPrompt += await fetchDiagnostico(businessId);
      }
    }

    // ── Stream hacia el cliente ───────────────────────────────────────────────
    const stream = anthropic.messages.stream({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system: systemPrompt,
      messages,
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (
              event.type === "content_block_delta" &&
              event.delta.type === "text_delta"
            ) {
              const data = JSON.stringify({ delta: event.delta.text });
              controller.enqueue(encoder.encode(`data: ${data}\n\n`));
            }
          }
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        } catch (err) {
          controller.error(err);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
      },
    });
  } catch {
    return Response.json(
      { error: "Erro ao processar a pergunta. Tenta novamente." },
      { status: 500 }
    );
  }
}
