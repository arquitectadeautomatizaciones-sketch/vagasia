import { createSupabaseAdminClient } from "@/utils/supabase/admin";
import { NextResponse } from "next/server";
import { getAuthBusinessId, unauthorizedJson } from "@/lib/api-auth";

export async function POST(request: Request) {
  const businessId = await getAuthBusinessId();
  if (!businessId) return unauthorizedJson();

  const formData = await request.formData();
  const file = formData.get("logo") as File | null;

  if (!file || file.size === 0) {
    return NextResponse.json({ error: "Ficheiro não fornecido." }, { status: 400 });
  }

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const path = `${businessId}/logo.${ext}`;

  const arrayBuffer = await file.arrayBuffer();
  const buffer = new Uint8Array(arrayBuffer);

  const db = createSupabaseAdminClient();

  const { error: uploadError } = await db.storage
    .from("business-logos")
    .upload(path, buffer, { contentType: file.type, upsert: true });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data: { publicUrl } } = db.storage
    .from("business-logos")
    .getPublicUrl(path);

  const logoUrl = `${publicUrl}?t=${Date.now()}`;

  const { error: updateError } = await db
    .from("businesses")
    .update({ logo_url: logoUrl })
    .eq("id", businessId);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ logo_url: logoUrl });
}
