/**
 * PATCH /api/team/professionals/[id]
 *   Actualiza nombre o estado activo de una profesional.
 *   Solo el owner puede modificar profesionales de su negocio.
 *
 * DELETE /api/team/professionals/[id]
 *   Baja suave: marca is_active=false. No borra datos.
 *   Solo el owner puede ejecutar esta acción.
 *   No se puede eliminar a uno mismo (al owner que hace la llamada).
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getAuthContext, unauthorizedJson, forbiddenJson } from "@/lib/api-auth";

function adminDb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { businessId, role } = await getAuthContext();
  if (!businessId) return unauthorizedJson();
  if (role !== "owner") return forbiddenJson();

  const { id } = await params;
  const body = await req.json().catch(() => ({})) as {
    name?: string;
    is_active?: boolean;
  };

  const patch: Record<string, unknown> = {};
  if (typeof body.name === "string" && body.name.trim()) {
    patch.name = body.name.trim();
  }
  if (typeof body.is_active === "boolean") {
    patch.is_active = body.is_active;
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "Nada para actualizar." }, { status: 400 });
  }

  // Verificar que la profesional pertenece al negocio del owner
  const { data, error } = await adminDb()
    .from("professionals")
    .update(patch)
    .eq("id", id)
    .eq("business_id", businessId)
    .select("id, name, role, is_active")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data)  return NextResponse.json({ error: "Profissional não encontrada." }, { status: 404 });

  return NextResponse.json(data);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { businessId, professionalId, role } = await getAuthContext();
  if (!businessId) return unauthorizedJson();
  if (role !== "owner") return forbiddenJson();

  const { id } = await params;

  // No puede eliminarse a sí mismo
  if (id === professionalId) {
    return NextResponse.json(
      { error: "Não podes remover o teu próprio perfil." },
      { status: 400 }
    );
  }

  // Baja suave — marca is_active=false, no borra datos
  const { error } = await adminDb()
    .from("professionals")
    .update({ is_active: false })
    .eq("id", id)
    .eq("business_id", businessId)
    .eq("role", "collaborator"); // extra seguridad: solo colaboradoras

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
