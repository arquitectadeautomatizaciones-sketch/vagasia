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
  const body = await req.json() as {
    whatsapp_number?: string | null;
    zapi_instance_url?: string | null;
  };

  const patch: Record<string, unknown> = {};

  if ("whatsapp_number" in body) {
    const wn = body.whatsapp_number;
    if (wn && !PHONE_RE.test(wn)) {
      return NextResponse.json(
        { error: "Formato inválido. Use +351XXXXXXXXX (sem espaços)." },
        { status: 400 }
      );
    }
    patch.whatsapp_number = wn || null;
  }

  if ("zapi_instance_url" in body) {
    patch.zapi_instance_url = body.zapi_instance_url?.trim() || null;
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "Nada para actualizar." }, { status: 400 });
  }

  const { error } = await adminDb()
    .from("businesses")
    .update(patch)
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
