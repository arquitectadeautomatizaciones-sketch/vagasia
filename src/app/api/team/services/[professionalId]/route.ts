/**
 * GET  /api/team/services/[professionalId]
 *   Devuelve los servicios activos de una profesional concreta.
 *
 * POST /api/team/services/[professionalId]
 *   Reemplaza los servicios de una profesional.
 *   El owner puede editar servicios de cualquier profesional del negocio.
 *   La collaborator solo puede editar los suyos.
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getAuthContext, unauthorizedJson, forbiddenJson } from "@/lib/api-auth";

function adminDb() {
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

async function verifyAccess(
  role: string,
  myProfessionalId: string | null,
  targetProfessionalId: string
): Promise<boolean> {
  if (role === "owner") return true;
  return myProfessionalId === targetProfessionalId;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ professionalId: string }> }
) {
  const { businessId, professionalId: myId, role } = await getAuthContext();
  if (!businessId) return unauthorizedJson();

  const { professionalId } = await params;
  if (!(await verifyAccess(role, myId, professionalId))) return forbiddenJson();

  const db = adminDb();

  // Verificar que la profesional pertenece al negocio
  const { data: prof } = await db
    .from("professionals")
    .select("id")
    .eq("id", professionalId)
    .eq("business_id", businessId)
    .single();

  if (!prof) return NextResponse.json({ error: "Profissional não encontrada." }, { status: 404 });

  const { data, error } = await db
    .from("services")
    .select("id, name, duration_minutes, price, active")
    .eq("business_id", businessId)
    .eq("professional_id", professionalId)
    .eq("active", true)
    .order("name", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ professionalId: string }> }
) {
  const { businessId, professionalId: myId, role } = await getAuthContext();
  if (!businessId) return unauthorizedJson();

  const { professionalId } = await params;
  if (!(await verifyAccess(role, myId, professionalId))) return forbiddenJson();

  const { services } = await req.json() as { services: ServiceInput[] };
  if (!Array.isArray(services) || services.length === 0) {
    return NextResponse.json({ error: "Adiciona pelo menos um serviço." }, { status: 400 });
  }

  const db = adminDb();

  // Verificar que la profesional pertenece al negocio
  const { data: prof } = await db
    .from("professionals")
    .select("id")
    .eq("id", professionalId)
    .eq("business_id", businessId)
    .single();

  if (!prof) return NextResponse.json({ error: "Profissional não encontrada." }, { status: 404 });

  // Reemplazar servicios de esta profesional
  await db
    .from("services")
    .delete()
    .eq("business_id", businessId)
    .eq("professional_id", professionalId);

  const { data, error } = await db
    .from("services")
    .insert(
      services.map((s) => ({
        business_id:     businessId,
        professional_id: professionalId,
        name:            s.name.trim(),
        duration_minutes: Number(s.duration_minutes),
        price:           Number(s.price),
        active:          true,
      }))
    )
    .select("id, name, duration_minutes, price");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ services: data });
}
