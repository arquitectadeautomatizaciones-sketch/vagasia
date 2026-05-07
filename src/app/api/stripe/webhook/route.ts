import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createSupabaseAdminClient } from "@/utils/supabase/admin";

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
