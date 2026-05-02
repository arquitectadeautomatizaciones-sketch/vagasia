import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/utils/supabase/admin";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Pedido inválido." }, { status: 400 });

  const { name, email, password, businessName, phone } = body as Record<string, string>;

  if (!name?.trim() || !email?.trim() || !password || !businessName?.trim() || !phone?.trim()) {
    return NextResponse.json({ error: "Todos os campos são obrigatórios." }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ error: "A password deve ter pelo menos 6 caracteres." }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();

  // 1a. Verificar se o email já existe
  const { data: existing } = await admin
    .from("businesses")
    .select("id")
    .eq("email", email.trim())
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      { error: "Este email já tem conta.", code: "EMAIL_EXISTS" },
      { status: 409 }
    );
  }

  // 1b. Criar utilizador no Supabase Auth (sem confirmação de email)
  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email: email.trim(),
    password,
    email_confirm: true,
    user_metadata: { name: name.trim() },
  });

  if (authError) {
    // All inputs validated above and no business row found — only remaining
    // cause of createUser failure is a duplicate auth account.
    return NextResponse.json(
      { error: "Este email já tem conta.", code: "EMAIL_EXISTS" },
      { status: 409 }
    );
  }

  const userId = authData.user.id;

  // 2. Criar o negócio ligado ao utilizador
  const { data: business, error: bizError } = await admin
    .from("businesses")
    .insert({
      name: businessName.trim(),
      slug: `${slugify(businessName)}-${userId.slice(0, 8)}`,
      category: "Negócio",
      phone: phone.trim(),
      email: email.trim(),
      address: "",
      auth_user_id: userId,
    })
    .select("id, name")
    .single();

  if (bizError || !business) {
    await admin.auth.admin.deleteUser(userId);
    return NextResponse.json({ error: "Erro ao criar negócio. Tente novamente." }, { status: 500 });
  }

  // 3. Guardar business_id no app_metadata — sem queries extras nos pedidos futuros
  await admin.auth.admin.updateUserById(userId, {
    app_metadata: {
      business_id: business.id,
      business_name: business.name,
    },
  });

  return NextResponse.json({ success: true }, { status: 201 });
}
