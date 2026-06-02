/**
 * GET /api/invite/[token]
 *
 * Endpoint público (sin autenticación) que devuelve la información
 * necesaria para mostrar la página de aceptación de invitación:
 *   - email de la colaboradora (prefilled, no editable)
 *   - nombre del owner que invita
 *   - nombre del negocio
 *   - estado de la invitación
 *
 * No expone datos sensibles — solo lo necesario para el formulario.
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function adminDb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  if (!token?.trim()) {
    return NextResponse.json({ error: "Token inválido." }, { status: 400 });
  }

  const db = adminDb();

  // 1. Buscar la invitación por token
  const { data: inv, error: invErr } = await db
    .from("team_invitations")
    .select("id, email, status, business_id")
    .eq("token", token.trim())
    .maybeSingle();

  if (invErr) return NextResponse.json({ error: invErr.message }, { status: 500 });
  if (!inv)   return NextResponse.json({ error: "Convite não encontrado." }, { status: 404 });

  if (inv.status !== "pending") {
    return NextResponse.json(
      { error: "Este convite já foi utilizado." },
      { status: 409 }
    );
  }

  // 2. Nombre del negocio
  const { data: biz } = await db
    .from("businesses")
    .select("name")
    .eq("id", inv.business_id)
    .single();

  // 3. Nombre del owner (profesional con role='owner' del mismo negocio)
  const { data: owner } = await db
    .from("professionals")
    .select("name")
    .eq("business_id", inv.business_id)
    .eq("role", "owner")
    .single();

  return NextResponse.json({
    email:        inv.email,
    ownerName:    owner?.name  ?? "A tua colega",
    businessName: biz?.name    ?? "",
  });
}
