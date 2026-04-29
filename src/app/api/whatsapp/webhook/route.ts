import { NextRequest, NextResponse } from "next/server";

const VERIFY_TOKEN = "vagasia2026";
const MAKE_WEBHOOK_URL =
  "https://hook.eu1.make.com/tqi9glcntj2rc7oyouzpv7qao98vksjd";

// GET — verificação do webhook pela Meta
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;

  const mode      = searchParams.get("hub.mode");
  const token     = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("[whatsapp/webhook] Verificação bem-sucedida.");
    return new NextResponse(challenge, { status: 200 });
  }

  console.warn("[whatsapp/webhook] Verificação falhada — token inválido.");
  return new NextResponse("Forbidden", { status: 403 });
}

// POST — recebe mensagens e reencaminha para Make
export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new NextResponse("Bad Request", { status: 400 });
  }

  try {
    const makeRes = await fetch(MAKE_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!makeRes.ok) {
      console.error("[whatsapp/webhook] Make respondeu com", makeRes.status);
    }
  } catch (err) {
    console.error("[whatsapp/webhook] Erro ao reencaminhar para Make:", err);
  }

  // A Meta exige sempre 200 OK — mesmo que o Make falhe
  return new NextResponse("OK", { status: 200 });
}
