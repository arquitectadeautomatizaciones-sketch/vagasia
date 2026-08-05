import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import { createSupabaseAdminClient } from "@/utils/supabase/admin";
import { unauthorizedJson } from "@/lib/api-auth";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * POST /api/auth/initialize
 *
 * Called from /onboarding once the user has confirmed their email.
 * Reads pending_business_name and pending_phone from user_metadata,
 * creates the businesses + professionals rows, and sets app_metadata.
 * Idempotent: if business_id already exists, returns 200 immediately.
 */
export async function POST() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return unauthorizedJson();

  // Idempotency: if already initialized, do nothing
  if (user.app_metadata?.business_id) {
    return NextResponse.json({ success: true, alreadyInitialized: true });
  }

  const name = (user.user_metadata?.name as string | undefined) ?? "";
  const businessName = (user.user_metadata?.pending_business_name as string | undefined) ?? "";
  const phone = (user.user_metadata?.pending_phone as string | undefined) ?? "";
  const email = user.email ?? "";

  if (!businessName) {
    return NextResponse.json({ error: "Dados de registo em falta." }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();
  const userId = user.id;

  // Create business
  const { data: business, error: bizError } = await admin
    .from("businesses")
    .insert({
      name: businessName,
      slug: `${slugify(businessName)}-${userId.slice(0, 8)}`,
      category: "Negócio",
      phone,
      email,
      address: "",
      auth_user_id: userId,
    })
    .select("id, name")
    .single();

  if (bizError || !business) {
    return NextResponse.json({ error: "Erro ao criar negócio." }, { status: 500 });
  }

  // Create professional owner
  const { data: professional, error: profError } = await admin
    .from("professionals")
    .insert({
      business_id: business.id,
      user_id: userId,
      name,
      role: "owner",
      is_active: true,
    })
    .select("id")
    .single();

  if (profError || !professional) {
    await admin.from("businesses").delete().eq("id", business.id);
    return NextResponse.json({ error: "Erro ao criar perfil profissional." }, { status: 500 });
  }

  // Set app_metadata and clear pending fields from user_metadata
  await admin.auth.admin.updateUserById(userId, {
    app_metadata: {
      business_id:     business.id,
      business_name:   business.name,
      professional_id: professional.id,
      role:            "owner",
      is_active:       false,
    },
    user_metadata: {
      name,
      pending_business_name: null,
      pending_phone: null,
    },
  });

  return NextResponse.json({ success: true }, { status: 201 });
}
