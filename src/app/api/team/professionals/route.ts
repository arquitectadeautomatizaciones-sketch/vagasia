/**
 * GET /api/team/professionals
 *
 * Devuelve todas las profesionales activas del negocio autenticado.
 * Accesible para owners y collaborators (cada una ve a todas — el owner
 * necesita esto para el selector de agenda; la collaborator para saber
 * con quién comparte el local).
 */
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getAuthBusinessId, unauthorizedJson } from "@/lib/api-auth";

function adminDb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

export async function GET() {
  const businessId = await getAuthBusinessId();
  if (!businessId) return unauthorizedJson();

  const { data, error } = await adminDb()
    .from("professionals")
    .select("id, business_id, user_id, name, role, is_active, created_at")
    .eq("business_id", businessId)
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}
