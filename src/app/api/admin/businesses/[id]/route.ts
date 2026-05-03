import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/utils/supabase/admin";
import { isAdminUser, forbiddenJson } from "@/lib/api-auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminUser())) return forbiddenJson();

  const { id } = await params;
  const body = await req.json() as { is_active?: boolean };

  if (typeof body.is_active !== "boolean") {
    return NextResponse.json({ error: "Campo is_active requerido (boolean)." }, { status: 400 });
  }

  const auth = createSupabaseAdminClient();

  // 1. Actualizar businesses.is_active en la base de datos
  const { data: business, error: bizError } = await auth
    .from("businesses")
    .update({ is_active: body.is_active })
    .eq("id", id)
    .select("auth_user_id")
    .single();

  if (bizError) return NextResponse.json({ error: bizError.message }, { status: 500 });

  // 2. Sincronizar app_metadata.is_active para que el middleware lo vea de inmediato
  if (business?.auth_user_id) {
    const { data: { user } } = await auth.auth.admin.getUserById(business.auth_user_id);
    if (user) {
      await auth.auth.admin.updateUserById(business.auth_user_id, {
        app_metadata: { ...user.app_metadata, is_active: body.is_active },
      });
    }
  }

  return NextResponse.json({ success: true, is_active: body.is_active });
}
