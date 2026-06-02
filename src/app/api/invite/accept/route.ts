/**
 * POST /api/invite/accept
 *
 * Acepta una invitación de colaboradora:
 *   1. Verifica que el token existe y está en estado 'pending'
 *   2. Crea el usuario en Supabase Auth con email+password
 *   3. Actualiza professionals.user_id con el nuevo usuario
 *   4. Guarda business_id, professional_id y role='collaborator' en app_metadata
 *   5. Marca la invitación como 'accepted'
 *
 * Body: { token: string, name: string, password: string }
 * (El email viene del token — no se puede cambiar)
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseAdminClient } from "@/utils/supabase/admin";

function adminDb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Pedido inválido." }, { status: 400 });

  const { token, name, password } = body as {
    token?: string;
    name?: string;
    password?: string;
  };

  if (!token?.trim()) {
    return NextResponse.json({ error: "Token inválido." }, { status: 400 });
  }
  if (!name?.trim()) {
    return NextResponse.json({ error: "O nome é obrigatório." }, { status: 400 });
  }
  if (!password || password.length < 6) {
    return NextResponse.json(
      { error: "A password deve ter pelo menos 6 caracteres." },
      { status: 400 }
    );
  }

  const db = adminDb();

  // 1. Buscar la invitación por token
  const { data: invitation, error: invErr } = await db
    .from("team_invitations")
    .select("id, business_id, professional_id, email, status")
    .eq("token", token.trim())
    .maybeSingle();

  if (invErr) return NextResponse.json({ error: invErr.message }, { status: 500 });
  if (!invitation) {
    return NextResponse.json({ error: "Convite não encontrado." }, { status: 404 });
  }
  if (invitation.status !== "pending") {
    return NextResponse.json(
      { error: "Este convite já foi utilizado ou expirou." },
      { status: 409 }
    );
  }

  // 2. Obtener datos del negocio para el app_metadata
  const { data: business } = await db
    .from("businesses")
    .select("id, name")
    .eq("id", invitation.business_id)
    .single();

  // 3. Crear usuario en Supabase Auth
  const authAdmin = createSupabaseAdminClient();
  const { data: authData, error: authError } = await authAdmin.auth.admin.createUser({
    email:         invitation.email,
    password,
    email_confirm: true,
    user_metadata: { name: name.trim() },
  });

  if (authError) {
    // Si el email ya tiene cuenta en Auth, devolvemos error claro
    const isDuplicate =
      authError.message.toLowerCase().includes("already") ||
      authError.message.toLowerCase().includes("exists");
    return NextResponse.json(
      { error: isDuplicate ? "Este email já tem uma conta." : authError.message },
      { status: 409 }
    );
  }

  const userId = authData.user.id;

  // 4. Actualizar professionals.user_id y name
  const { error: profErr } = await db
    .from("professionals")
    .update({ user_id: userId, name: name.trim() })
    .eq("id", invitation.professional_id);

  if (profErr) {
    // Rollback: eliminar usuario creado
    await authAdmin.auth.admin.deleteUser(userId);
    return NextResponse.json({ error: "Erro ao vincular perfil." }, { status: 500 });
  }

  // 5. Guardar business_id, professional_id y role en app_metadata
  await authAdmin.auth.admin.updateUserById(userId, {
    app_metadata: {
      business_id:     invitation.business_id,
      business_name:   business?.name ?? "",
      professional_id: invitation.professional_id,
      role:            "collaborator",
      is_active:       true,
    },
  });

  // 6. Marcar invitación como aceptada
  await db
    .from("team_invitations")
    .update({ status: "accepted" })
    .eq("id", invitation.id);

  return NextResponse.json({ success: true }, { status: 200 });
}
