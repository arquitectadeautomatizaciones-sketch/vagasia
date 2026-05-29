/**
 * POST /api/slots/generate
 *
 * Genera (o regenera) los available_slots de las próximas 4 semanas
 * para el negocio autenticado.
 *
 * Útil cuando la profesional cambia sus horarios y quiere regenerar
 * los slots sin pasar de nuevo por el onboarding.
 *
 * Body opcional: { weeks?: number }  (1–12, default 4)
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getAuthBusinessId, unauthorizedJson } from "@/lib/api-auth";
import { generateSlotsForBusiness } from "@/lib/generate-slots";

function adminDb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

export async function POST(req: NextRequest) {
  const businessId = await getAuthBusinessId();
  if (!businessId) return unauthorizedJson();

  // Weeks opcional: entre 1 y 12
  let weeks = 4;
  try {
    const body = await req.json().catch(() => ({}));
    if (typeof body?.weeks === "number") {
      weeks = Math.min(12, Math.max(1, Math.floor(body.weeks)));
    }
  } catch {
    // ignorar — usamos el default
  }

  const result = await generateSlotsForBusiness(businessId, adminDb(), weeks);

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    inserted: result.inserted,
    weeks,
  });
}
