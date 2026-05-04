import { createSupabaseAdminClient } from "@/utils/supabase/admin";
import { NextResponse } from "next/server";
import { getAuthBusinessId, unauthorizedJson } from "@/lib/api-auth";

async function sendCardCompleteWhatsApp({
  clientPhone,
  clientName,
  businessName,
  reward,
}: {
  clientPhone: string;
  clientName: string;
  businessName: string;
  reward: string;
}) {
  const phoneNumberId = process.env.META_WA_PHONE_NUMBER_ID;
  const token = process.env.META_WA_TOKEN;

  if (!phoneNumberId || !token) {
    console.warn("[fidelizacao] META_WA_PHONE_NUMBER_ID ou META_WA_TOKEN não configurados.");
    return;
  }

  // Remove tudo excepto dígitos ("+351 912 345 678" → "351912345678")
  const to = clientPhone.replace(/\D/g, "");

  const res = await fetch(
    `https://graph.facebook.com/v20.0/${phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "template",
        template: {
          name: "vagasia_cartao_completo",
          language: { code: "pt_PT" },
          components: [
            {
              type: "body",
              parameters: [
                { type: "text", text: clientName },
                { type: "text", text: businessName },
                { type: "text", text: reward },
              ],
            },
          ],
        },
      }),
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    console.error("[fidelizacao] Erro WhatsApp API:", JSON.stringify(err));
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const businessId = await getAuthBusinessId();
  if (!businessId) return unauthorizedJson();

  const body = await request.json();
  const { action, reward, goal } = body;

  const db = createSupabaseAdminClient();

  const { data: card } = await db
    .from("loyalty_cards")
    .select("id, total_stamps, goal, reward")
    .eq("id", id)
    .eq("business_id", businessId)
    .single();

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
    if (reward !== undefined) update.reward = reward?.trim() || null;
    if (goal !== undefined) update.goal = Math.max(1, Number(goal));
  }

  const { data, error } = await db
    .from("loyalty_cards")
    .update(update)
    .eq("id", id)
    .select("*, client:client_id(name, phone)")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Enviar WhatsApp se este carimbo completou o cartão
  const justCompleted =
    action === "stamp" && (card.total_stamps + 1) >= card.goal;

  if (justCompleted) {
    const client = data.client as { name: string; phone: string } | null;

    const { data: business } = await db
      .from("businesses")
      .select("name")
      .eq("id", businessId)
      .single();

    if (client?.phone && business?.name) {
      sendCardCompleteWhatsApp({
        clientPhone: client.phone,
        clientName: client.name,
        businessName: business.name,
        reward: card.reward ?? "recompensa especial",
      }).catch((err) => console.error("[fidelizacao] Falha ao enviar WhatsApp:", err));
    }
  }

  return NextResponse.json(data);
}
