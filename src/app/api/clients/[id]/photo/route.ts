import { createSupabaseAdminClient } from "@/utils/supabase/admin";
import { NextResponse } from "next/server";
import { getAuthBusinessId, unauthorizedJson } from "@/lib/api-auth";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const businessId = await getAuthBusinessId();
  if (!businessId) return unauthorizedJson();

  const { id: clientId } = await params;

  const db = createSupabaseAdminClient();

  // Verify client belongs to this business
  const { data: client, error: clientError } = await db
    .from("clients")
    .select("id")
    .eq("id", clientId)
    .eq("business_id", businessId)
    .single();

  if (clientError || !client) {
    return NextResponse.json({ error: "Cliente não encontrado." }, { status: 404 });
  }

  const formData = await request.formData();
  const file = formData.get("photo") as File | null;

  if (!file || file.size === 0) {
    return NextResponse.json({ error: "Ficheiro não fornecido." }, { status: 400 });
  }

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const path = `${businessId}/${clientId}.${ext}`;

  const arrayBuffer = await file.arrayBuffer();
  const buffer = new Uint8Array(arrayBuffer);

  const { error: uploadError } = await db.storage
    .from("client-photos")
    .upload(path, buffer, { contentType: file.type, upsert: true });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data: { publicUrl } } = db.storage
    .from("client-photos")
    .getPublicUrl(path);

  // Append cache-busting so the browser always loads the new photo
  const photoUrl = `${publicUrl}?t=${Date.now()}`;

  const { error: updateError } = await db
    .from("clients")
    .update({ photo_url: photoUrl })
    .eq("id", clientId);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ photo_url: photoUrl });
}
