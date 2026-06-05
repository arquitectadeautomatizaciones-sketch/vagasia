import { createSupabaseAdminClient } from "@/utils/supabase/admin";
import { NextRequest, NextResponse } from "next/server";
import { getAuthBusinessId, unauthorizedJson } from "@/lib/api-auth";

// ── Tipos do select com joins ─────────────────────────────────────────────────
// O select de loyalty_cards com joins (client/business) faz o type-inference do
// Supabase devolver GenericStringError; tipamos explicitamente a forma da linha.
type JoinedClient = { name: string | null; phone: string | null };
type JoinedBusiness = { name: string | null; zapi_instance_url: string | null };

interface LoyaltyCardRow {
  id: string;
  total_stamps: number;
  goal: number;
  reward: string | null;
  business_id: string;
  client_id: string;
  client: JoinedClient | JoinedClient[] | null;
  business: JoinedBusiness | JoinedBusiness[] | null;
}

// Normaliza uma relação to-one que o Supabase pode devolver como objeto ou array.
function firstRelation<T>(rel: T | T[] | null): T | null {
  if (Array.isArray(rel)) return rel[0] ?? null;
  return rel ?? null;
}

// ── Z-API helpers ─────────────────────────────────────────────────────────────

async function sendZapiText(zapiInstanceUrl: string, phone: string, message: string) {
  const url = `${zapiInstanceUrl}/send-text`;
  const clientToken = process.env.ZAPI_CLIENT_TOKEN ?? "F17031739653947e4a7202c19bff1d7a5S";
  try {
    await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Client-Token": clientToken,
      },
      body: JSON.stringify({ phone: phone.replace(/\D/g, ""), message }),
    });
  } catch (err) {
    console.error("[fidelizacao] Erro ao enviar Z-API:", err);
  }
}

/**
 * Envia mensagem de progresso ou cartão completo via Z-API.
 * fire-and-forget — não bloqueia a resposta.
 */
async function sendFidelizacaoWhatsApp({
  zapiInstanceUrl,
  clientPhone,
  clientName,
  businessName,
  totalStamps,
  goal,
  reward,
  completed,
}: {
  zapiInstanceUrl: string;
  clientPhone: string;
  clientName: string;
  businessName: string;
  totalStamps: number; // novo valor já incrementado
  goal: number;
  reward: string;
  completed: boolean;
}) {
  if (!zapiInstanceUrl || !clientPhone) return;

  const message = completed
    ? `🎉 Parabéns ${clientName}! Completaste o teu cartão de fidelidade na ${businessName}! Tens direito a: ${reward}. Apresenta esta mensagem na tua próxima visita. Válido por 30 dias. 💚`
    : `⭐ Olá ${clientName}! Obrigada pela tua visita. Já tens ${totalStamps} de ${goal} carimbos no teu cartão de fidelidade da ${businessName}. ${goal - totalStamps} visitinha${goal - totalStamps !== 1 ? "s" : ""} para ganhares: ${reward}! 💚`;

  await sendZapiText(zapiInstanceUrl, clientPhone, message);
}

// ── PATCH handler ─────────────────────────────────────────────────────────────

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const businessId = await getAuthBusinessId();
  if (!businessId) return unauthorizedJson();

  const body = await request.json();
  const { action, reward, goal } = body;

  const db = createSupabaseAdminClient();

  // Fetch the card + client phone + business zapi url in one query
  const { data: cardRaw } = await db
    .from("loyalty_cards")
    .select(
      "id, total_stamps, goal, reward, business_id, client_id, " +
      "client:client_id(name, phone), " +
      "business:business_id(name, zapi_instance_url)"
    )
    .eq("id", id)
    .eq("business_id", businessId)
    .single();

  const card = cardRaw as unknown as LoyaltyCardRow | null;

  if (!card) {
    return NextResponse.json({ error: "Cartão não encontrado." }, { status: 404 });
  }

  let update: Record<string, unknown> = {};

  if (action === "stamp") {
    if (card.total_stamps >= card.goal) {
      return NextResponse.json(
        { error: "Cartão já completo. Inicia um novo ciclo primeiro." },
        { status: 409 }
      );
    }
    update.total_stamps = card.total_stamps + 1;

  } else if (action === "reset") {
    update.total_stamps = 0;

  } else {
    // Edit mode: update reward and/or goal
    if (reward !== undefined) update.reward = reward?.trim() || null;
    if (goal   !== undefined) update.goal   = Math.max(1, Number(goal));
  }

  const { data, error } = await db
    .from("loyalty_cards")
    .update(update)
    .eq("id", id)
    .select(
      "*, " +
      "client:client_id(name, phone), " +
      "business:business_id(name, zapi_instance_url)"
    )
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // ── WhatsApp notification on stamp ──────────────────────────────────────────
  if (action === "stamp") {
    const newTotal     = card.total_stamps + 1;
    const completed    = newTotal >= card.goal;
    const rewardText   = card.reward ?? "recompensa especial";
    const client       = firstRelation(card.client);
    const business     = firstRelation(card.business);

    if (client?.phone && business?.zapi_instance_url) {
      sendFidelizacaoWhatsApp({
        zapiInstanceUrl: business.zapi_instance_url,
        clientPhone:     client.phone,
        clientName:      client.name  || "cliente",
        businessName:    business.name || "o negócio",
        totalStamps:     newTotal,
        goal:            card.goal,
        reward:          rewardText,
        completed,
      }).catch((err) => console.error("[fidelizacao] WhatsApp falhou:", err));
    }
  }

  // Strip internal joins from response to keep the shape clean
  const dataObj = (data ?? {}) as unknown as Record<string, unknown> & { business?: unknown };
  const { business: _b, ...safeData } = dataObj;
  void _b;
  return NextResponse.json(safeData);
}
