import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import { unauthorizedJson } from "@/lib/api-auth";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2026-04-22.dahlia" });

export async function POST() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return unauthorizedJson();

  const businessId = user.app_metadata?.business_id as string | undefined;
  if (!businessId) return unauthorizedJson();

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://vagasia.pt";

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: process.env.STRIPE_PRICE_ID!, quantity: 1 }],
    client_reference_id: businessId,
    customer_email: user.email,
    success_url: `${baseUrl}/dashboard?subscribed=1`,
    cancel_url: `${baseUrl}/subscribe?cancelled=1`,
    locale: "pt",
  });

  return NextResponse.json({ url: session.url });
}
