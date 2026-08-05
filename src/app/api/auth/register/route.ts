import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/utils/supabase/admin";
import { checkRateLimit } from "@/lib/rate-limit";

async function verifyTurnstile(token: string, ip: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true; // dev fallback when key not configured locally

  const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ secret, response: token, remoteip: ip }),
  });
  const data = await res.json() as { success: boolean };
  return data.success === true;
}

async function notifyDiana(name: string, email: string, businessName: string) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Vagas.IA <noreply@vagasia.pt>",
      to: "dianitao83@hotmail.com",
      subject: `✅ Novo registo: ${businessName}`,
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#0F172A;color:#e2e8f0;border-radius:12px">
          <p style="font-size:15px;margin:0 0 16px">Novo utilizador registado em Vagas.IA:</p>
          <table style="font-size:14px;color:#cbd5e1;border-collapse:collapse;width:100%">
            <tr><td style="padding:6px 0;color:#94a3b8">Nome</td><td style="padding:6px 0">${name}</td></tr>
            <tr><td style="padding:6px 0;color:#94a3b8">Email</td><td style="padding:6px 0">${email}</td></tr>
            <tr><td style="padding:6px 0;color:#94a3b8">Negócio</td><td style="padding:6px 0">${businessName}</td></tr>
          </table>
          <p style="margin-top:24px;font-size:13px;color:#475569">Aguarda confirmação de email — o negócio ainda não foi criado.</p>
        </div>
      `,
    }),
  }).catch(() => {});
}

export async function POST(req: NextRequest) {
  // 1. Rate limit by IP
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const { allowed, retryAfterSeconds } = checkRateLimit(ip);
  if (!allowed) {
    return NextResponse.json(
      { error: `Demasiadas tentativas. Tente novamente em ${Math.ceil(retryAfterSeconds / 60)} minutos.` },
      { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } }
    );
  }

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Pedido inválido." }, { status: 400 });

  const { name, email, password, businessName, phone, turnstileToken } = body as Record<string, string>;

  // 2. Validate required fields
  if (!name?.trim() || !email?.trim() || !password || !businessName?.trim() || !phone?.trim()) {
    return NextResponse.json({ error: "Todos os campos são obrigatórios." }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ error: "A password deve ter pelo menos 6 caracteres." }, { status: 400 });
  }

  // 3. Turnstile verification
  if (!turnstileToken) {
    return NextResponse.json({ error: "Verificação de segurança necessária." }, { status: 400 });
  }
  const turnstileOk = await verifyTurnstile(turnstileToken, ip);
  if (!turnstileOk) {
    return NextResponse.json({ error: "Verificação de segurança falhou. Tente novamente." }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();

  // 4. Check for duplicate email in auth (createUser will fail anyway, but give a clean message)
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

  // 5. Create auth user WITHOUT email confirmation — Supabase sends the confirmation email
  //    Business and professional rows are created AFTER the user clicks the link (/api/auth/initialize)
  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email: email.trim(),
    password,
    email_confirm: false,
    user_metadata: {
      name: name.trim(),
      pending_business_name: businessName.trim(),
      pending_phone: phone.trim(),
    },
  });

  if (authError) {
    return NextResponse.json(
      { error: "Este email já tem conta.", code: "EMAIL_EXISTS" },
      { status: 409 }
    );
  }

  // 6. Notify Diana via email (fire-and-forget)
  notifyDiana(name.trim(), email.trim(), businessName.trim()).catch(() => {});

  return NextResponse.json({ success: true, requiresEmailConfirmation: true }, { status: 201 });
}
