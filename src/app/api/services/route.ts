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

// UUID v4 regex — distingue IDs reais do Supabase de IDs temporários do cliente
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(req: NextRequest) {
  const businessId = await getAuthBusinessId();
  if (!businessId) return unauthorizedJson();

  const all = new URL(req.url).searchParams.get("all") === "true";

  let query = admin()
    .from("services")
    .select("id, name, duration_minutes, price, active")
    .eq("business_id", businessId)
    .order("name", { ascending: true });

  if (!all) query = query.eq("active", true);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

interface ServiceInput {
  id: string;          // UUID se existente, string temporária se novo
  name: string;
  duration_minutes: number;
  price: number;
  active: boolean;
}

export async function POST(req: NextRequest) {
  const businessId = await getAuthBusinessId();
  if (!businessId) return unauthorizedJson();

  const { services } = await req.json() as { services: ServiceInput[] };
  if (!Array.isArray(services)) {
    return NextResponse.json({ error: "Payload inválido." }, { status: 400 });
  }

  const db = admin();

  // Separar serviços existentes (UUID real) de novos (ID temporário do cliente)
  const existing = services.filter((s) => UUID_RE.test(s.id));
  const toInsert = services.filter((s) => !UUID_RE.test(s.id));
  const existingIds = existing.map((s) => s.id);

  // 1. Eliminar serviços que foram removidos pelo utilizador
  const { data: dbServices } = await db
    .from("services")
    .select("id")
    .eq("business_id", businessId);

  const dbIds = (dbServices ?? []).map((s: { id: string }) => s.id);
  const toDelete = dbIds.filter((id: string) => !existingIds.includes(id));

  if (toDelete.length > 0) {
    await db.from("services").delete().in("id", toDelete);
  }

  // 2. Actualizar serviços existentes
  for (const s of existing) {
    await db
      .from("services")
      .update({
        name: s.name.trim(),
        duration_minutes: Number(s.duration_minutes),
        price: Number(s.price),
        active: s.active,
      })
      .eq("id", s.id)
      .eq("business_id", businessId);
  }

  // 3. Inserir novos serviços
  if (toInsert.length > 0) {
    await db.from("services").insert(
      toInsert.map((s) => ({
        business_id: businessId,
        name: s.name.trim(),
        duration_minutes: Number(s.duration_minutes),
        price: Number(s.price),
        active: s.active,
      }))
    );
  }

  // Devolver lista actualizada
  const { data, error } = await db
    .from("services")
    .select("id, name, duration_minutes, price, active")
    .eq("business_id", businessId)
    .order("name", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ services: data });
}
