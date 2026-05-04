import { createSupabaseAdminClient } from "@/utils/supabase/admin";
import { NextResponse } from "next/server";
import { getAuthBusinessId, unauthorizedJson } from "@/lib/api-auth";

export async function GET() {
  const businessId = await getAuthBusinessId();
  if (!businessId) return unauthorizedJson();

  const { data, error } = await createSupabaseAdminClient()
    .from("clients")
    .select("*")
    .eq("business_id", businessId)
    .order("name", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(request: Request) {
  const businessId = await getAuthBusinessId();
  if (!businessId) return unauthorizedJson();

  const body = await request.json();
  const { name, phone, email, notes, data_nascimento } = body;

  if (!name?.trim() || !phone?.trim()) {
    return NextResponse.json({ error: "Nome e telefone são obrigatórios." }, { status: 400 });
  }

  const { data, error } = await createSupabaseAdminClient()
    .from("clients")
    .insert({
      business_id: businessId,
      name: name.trim(),
      phone: phone.trim(),
      email: email?.trim() || null,
      notes: notes?.trim() || null,
      data_nascimento: data_nascimento || null,
      total_appointments: 0,
      total_spent: 0,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
