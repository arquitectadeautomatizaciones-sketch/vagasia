import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createSupabaseAdminClient } from "@/utils/supabase/admin";

async function sendTrialEndingEmail(email: string, trialEndTimestamp: number) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return; // email não configurado — Stripe envia o seu próprio aviso

  const trialEnd = new Date(trialEndTimestamp * 1000);
  const formatted = trialEnd.toLocaleDateString("pt-PT", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "VagasIA <noreply@vagasia.pt>",
      to: email,
      subject: "O teu período experimental termina em 3 dias",
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;background:#0F172A;color:#e2e8f0;border-radius:16px">
          <h1 style="color:#00B4D8;font-size:22px;margin-bottom:8px">VagasIA</h1>
          <p style="color:#94a3b8;font-size:13px;margin-top:0">Sistema de Gestão</p>
          <hr style="border-color:#1e293b;margin:24px 0"/>
          <h2 style="font-size:18px;font-weight:700;color:#f1f5f9">O teu trial termina a ${formatted}</h2>
          <p style="color:#94a3b8;line-height:1.6">
            O teu período experimental de 7 dias gratuitos do VagasIA está quase a terminar.
            A partir de <strong style="color:#f1f5f9">${formatted}</strong>, o plano passa a custar <strong style="color:#f1f5f9">€37/mês</strong>.
          </p>
          <p style="color:#94a3b8;line-height:1.6">
            Se não quiseres continuar, podes cancelar antes dessa data sem qualquer custo.
          </p>
          <a href="https://vagasia.pt/dashboard"
             style="display:inline-block;margin-top:16px;padding:12px 24px;background:#00B4D8;color:#fff;font-weight:600;border-radius:10px;text-decoration:none">
            Aceder ao dashboard
          </a>
          <p style="margin-top:32px;font-size:12px;color:#475569">
            Questões? Responde a este email ou contacta-nos em geral@dianagarcia.pt.
          </p>
        </div>
      `,
    }),
  });
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2026-04-22.dahlia" });

// Next.js App Router não parseia o body automaticamente para webhooks — é necessário rawBody
export const dynamic = "force-dynamic";

async function setBusinessActive(businessId: string, active: boolean) {
  const admin = createSupabaseAdminClient();

  // Atualizar tabela businesses
  await admin
    .from("businesses")
    .update({ is_active: active })
    .eq("id", businessId);

  // Atualizar app_metadata do utilizador dono do negócio
  const { data: business } = await admin
    .from("businesses")
    .select("auth_user_id")
    .eq("id", businessId)
    .single();

  if (business?.auth_user_id) {
    const { data: { user } } = await admin.auth.admin.getUserById(business.auth_user_id);
    if (user) {
      await admin.auth.admin.updateUserById(user.id, {
        app_metadata: { ...user.app_metadata, is_active: active },
      });
    }
  }
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Assinatura em falta." }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return NextResponse.json({ error: "Assinatura inválida." }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const businessId = session.client_reference_id;
    if (businessId) await setBusinessActive(businessId, true);
  }

  if (event.type === "customer.subscription.trial_will_end") {
    const subscription = event.data.object as Stripe.Subscription;
    const customerId = subscription.customer as string;
    const customer = await stripe.customers.retrieve(customerId);
    if (!customer.deleted && customer.email && subscription.trial_end) {
      await sendTrialEndingEmail(customer.email, subscription.trial_end);
    }
  }

  if (event.type === "customer.subscription.deleted") {
    const subscription = event.data.object as Stripe.Subscription;
    // Encontrar negócio via customer ID
    const admin = createSupabaseAdminClient();
    const customerId = subscription.customer as string;

    // Listar sessões de checkout para encontrar o business_id
    const sessions = await stripe.checkout.sessions.list({
      customer: customerId,
      limit: 1,
    });
    const businessId = sessions.data[0]?.client_reference_id;
    if (businessId) await setBusinessActive(businessId, false);
  }

  return NextResponse.json({ received: true });
}
