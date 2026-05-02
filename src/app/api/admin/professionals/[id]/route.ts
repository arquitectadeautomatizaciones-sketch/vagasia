import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isAdminUser, forbiddenJson } from "@/lib/api-auth";

function adminDb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

const PHONE_RE = /^\+\d{10,15}$/;

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminUser())) return forbiddenJson();

  const { id } = await params;
  const { whatsapp_number } = await req.json() as { whatsapp_number: string | null };

  if (whatsapp_number && !PHONE_RE.test(whatsapp_number)) {
    return NextResponse.json(
      { error: "Formato inválido. Use +351XXXXXXXXX (sem espaços)." },
      { status: 400 }
    );
  }

  const { error } = await adminDb()
    .from("businesses")
    .update({ whatsapp_number: whatsapp_number || null })
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
