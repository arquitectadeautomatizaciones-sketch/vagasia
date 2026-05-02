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

interface ServiceInput {
  name: string;
  duration_minutes: number;
  price: number;
}

export async function POST(req: NextRequest) {
  const businessId = await getAuthBusinessId();
  if (!businessId) return unauthorizedJson();

  const { services } = await req.json() as { services: ServiceInput[] };
  if (!Array.isArray(services) || services.length === 0) {
    return NextResponse.json({ error: "Adiciona pelo menos um serviço." }, { status: 400 });
  }

  const db = admin();
  // Replace any previously saved onboarding services
  await db.from("services").delete().eq("business_id", businessId);

  const { data, error } = await db
    .from("services")
    .insert(
      services.map((s) => ({
        business_id: businessId,
        name: s.name.trim(),
        duration_minutes: Number(s.duration_minutes),
        price: Number(s.price),
        active: true,
      }))
    )
    .select("id, name, duration_minutes, price");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ services: data });
}
