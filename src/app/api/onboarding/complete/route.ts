/**
 * POST /api/onboarding/complete
 *
 * Marca el onboarding como completado para el negocio autenticado:
 *   1. Guarda trial_started_at en businesses y app_metadata
 *   2. Genera available_slots para las próximas 4 semanas (silencioso si falla)
 *   3. Notifica a Diana vía webhook de n8n (fire-and-forget)
 */
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import { createSupabaseAdminClient } from "@/utils/supabase/admin";
import { unauthorizedJson } from "@/lib/api-auth";
import { generateSlotsForBusiness } from "@/lib/generate-slots";

function adminDb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

/** Envía notificación WhatsApp a Diana vía webhook n8n (fire-and-forget). */
async function notifyDiana(payload: {
  businessId: string;
  name: string;
  category: string;
  phone: string;
  email: string;
}) {
  const url = process.env.VAGASIA_N8N_NOTIFY_URL;
  if (!url) {
    console.warn("[onboarding/complete] VAGASIA_N8N_NOTIFY_URL no configurada — notificación omitida.");
    return;
  }
  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    // No bloquea el onboarding
    console.error("[onboarding/complete] Error al notificar Diana:", err);
  }
}

export async function POST() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return unauthorizedJson();

  const businessId = user.app_metadata?.business_id as string | undefined;
  if (!businessId) return unauthorizedJson();

  const trialStartedAt = new Date().toISOString();
  const db = adminDb();

  // 1. Actualizar businesses y registrar inicio del trial
  const { data: business } = await db
    .from("businesses")
    .update({ trial_started_at: trialStartedAt })
    .eq("id", businessId)
    .select("name, category, phone, email")
    .single();

  const admin = createSupabaseAdminClient();
  const { error } = await admin.auth.admin.updateUserById(user.id, {
    app_metadata: {
      ...user.app_metadata,
      business_name: business?.name ?? user.app_metadata?.business_name,
      onboarding_completed: true,
      trial_started_at: trialStartedAt,
    },
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // 2. Generar available_slots para las próximas 4 semanas (silencioso si falla)
  try {
    const slotResult = await generateSlotsForBusiness(businessId, db, 4);
    if (slotResult.error) {
      console.error("[onboarding/complete] Error al generar slots:", slotResult.error);
    } else {
      console.info(`[onboarding/complete] Slots generados: ${slotResult.inserted}`);
    }
  } catch (slotErr) {
    console.error("[onboarding/complete] Excepción al generar slots:", slotErr);
  }

  // 3. Notificar a Diana vía n8n (fire-and-forget — no bloquea la respuesta)
  notifyDiana({
    businessId,
    name:     business?.name     ?? "—",
    category: business?.category ?? "—",
    phone:    business?.phone    ?? "—",
    email:    business?.email    ?? user.email ?? "—",
  }).catch(console.error);

  return NextResponse.json({ success: true });
}
