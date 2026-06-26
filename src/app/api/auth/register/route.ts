import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/utils/supabase/admin";

async function sendWelcomeEmail(toEmail: string, firstName: string) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Sofía do VagasIA <hola@arquitectadeautomatizaciones.com>",
      to: toEmail,
      subject: "Sofía já está a trabalhar por ti 💚",
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:40px 28px;background:#0F172A;color:#e2e8f0;border-radius:16px">
          <p style="font-size:15px;line-height:1.7;color:#cbd5e1;margin:0 0 20px">Olá ${firstName},</p>
          <p style="font-size:15px;line-height:1.7;color:#cbd5e1;margin:0 0 20px">Bem-vinda ao Vagas.IA. Sou a Sofía, a tua assistente.</p>
          <p style="font-size:15px;line-height:1.7;color:#cbd5e1;margin:0 0 20px">Já configurei a tua agenda para as próximas 4 semanas.</p>
          <p style="font-size:15px;line-height:1.7;color:#cbd5e1;margin:0 0 28px">Agora só precisas de adicionar os teus serviços e os teus primeiros clientes — em menos de 5 minutos o sistema já trabalha por ti.</p>
          <a href="https://vagasia.vercel.app/onboarding"
             style="display:inline-block;padding:13px 28px;background:#2A9D8F;color:#fff;font-weight:600;border-radius:10px;text-decoration:none;font-size:15px">
            Entrar no VagasIA
          </a>
          <p style="margin-top:36px;font-size:14px;color:#64748b;line-height:1.6">Vemo-nos lá dentro. 💚<br/><strong style="color:#94a3b8">Sofía</strong></p>
        </div>
      `,
    }),
  }).catch(() => {});
}

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

  // 3. Criar professional owner para este negócio
  const { data: professional, error: profError } = await admin
    .from("professionals")
    .insert({
      business_id: business.id,
      user_id: userId,
      name: name.trim(),
      role: "owner",
      is_active: true,
    })
    .select("id")
    .single();

  if (profError || !professional) {
    // Rollback: eliminar business e utilizador criados
    await admin.from("businesses").delete().eq("id", business.id);
    await admin.auth.admin.deleteUser(userId);
    return NextResponse.json({ error: "Erro ao criar perfil profissional." }, { status: 500 });
  }

  // 4. Guardar business_id, professional_id e role no app_metadata
  // is_active=false até o utilizador subscrever via Stripe
  await admin.auth.admin.updateUserById(userId, {
    app_metadata: {
      business_id:     business.id,
      business_name:   business.name,
      professional_id: professional.id,
      role:            "owner",
      is_active:       false,
    },
  });

  // 5. Email de bienvenida de Sofía (fire-and-forget — no bloquea el registro)
  const firstName = name.trim().split(" ")[0];
  sendWelcomeEmail(email.trim(), firstName).catch(() => {});

  return NextResponse.json({ success: true }, { status: 201 });
}
