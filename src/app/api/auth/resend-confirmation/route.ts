import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/utils/supabase/admin";

async function sendConfirmationEmail(toEmail: string, firstName: string, confirmationUrl: string) {
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
      subject: "Confirma o teu email para ativar o VagasIA 💚",
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:40px 28px;background:#0F172A;color:#e2e8f0;border-radius:16px">
          <p style="font-size:15px;line-height:1.7;color:#cbd5e1;margin:0 0 20px">Olá ${firstName},</p>
          <p style="font-size:15px;line-height:1.7;color:#cbd5e1;margin:0 0 28px">Clica no botão abaixo para confirmar o teu email e entrar no VagasIA. O link é válido por 24 horas.</p>
          <a href="${confirmationUrl}"
             style="display:inline-block;padding:13px 28px;background:#2A9D8F;color:#fff;font-weight:600;border-radius:10px;text-decoration:none;font-size:15px">
            Confirmar email e entrar
          </a>
          <p style="margin-top:28px;font-size:13px;color:#475569;line-height:1.6">Se não criaste uma conta no VagasIA, ignora este email.</p>
          <p style="margin-top:36px;font-size:14px;color:#64748b;line-height:1.6">Vemo-nos lá dentro. 💚<br/><strong style="color:#94a3b8">Sofía</strong></p>
        </div>
      `,
    }),
  }).catch(() => {});
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body?.email) return NextResponse.json({ error: "Email obrigatório." }, { status: 400 });

  const admin = createSupabaseAdminClient();
  const origin = req.headers.get("origin") ?? "https://vagasia.vercel.app";

  // Use magiclink (no password required) — clicking it also confirms the email
  const { data: linkData, error } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email: body.email,
    options: { redirectTo: `${origin}/auth/callback?next=/onboarding` },
  });

  if (error) {
    return NextResponse.json({ error: "Não foi possível reenviar o email." }, { status: 500 });
  }

  const confirmationUrl = linkData?.properties?.action_link ?? "";

  if (confirmationUrl) {
    const firstName = (body.name as string | undefined)?.split(" ")[0] ?? "utilizador";
    await sendConfirmationEmail(body.email, firstName, confirmationUrl);
  }

  return NextResponse.json({ success: true });
}
