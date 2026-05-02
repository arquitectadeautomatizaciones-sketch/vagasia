import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getAuthBusinessId, unauthorizedJson } from "@/lib/api-auth";

function admin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

export async function PATCH(req: NextRequest) {
  const businessId = await getAuthBusinessId();
  if (!businessId) return unauthorizedJson();

  const { name, category } = await req.json();
  if (!name?.trim() || !category?.trim()) {
    return NextResponse.json({ error: "Nome e tipo de negócio são obrigatórios." }, { status: 400 });
  }

  const { error } = await admin()
    .from("businesses")
    .update({ name: name.trim(), category: category.trim() })
    .eq("id", businessId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
