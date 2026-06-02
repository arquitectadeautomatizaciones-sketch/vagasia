/**
 * GET  /api/team/hours/[professionalId]
 *   Devuelve los horarios de trabajo de una profesional.
 *   El owner puede leer horarios de cualquier profesional del negocio.
 *   La collaborator solo puede leer los suyos.
 *
 * POST /api/team/hours/[professionalId]
 *   Reemplaza los horarios de una profesional.
 *   El owner puede editar horarios de cualquier profesional.
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

interface HourInput {
  day_of_week: number;
  open_time: string;
  close_time: string;
  is_closed: boolean;
}

async function verifyAccess(
  businessId: string,
  role: string,
  myProfessionalId: string | null,
  targetProfessionalId: string
): Promise<boolean> {
  if (role === "owner") return true;
  // collaborator solo puede acceder a sus propios datos
  return myProfessionalId === targetProfessionalId;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ professionalId: string }> }
) {
  const { businessId, professionalId: myId, role } = await getAuthContext();
  if (!businessId) return unauthorizedJson();

  const { professionalId } = await params;
  if (!(await verifyAccess(businessId, role, myId, professionalId))) {
    return forbiddenJson();
  }

  // Verificar que la profesional pertenece al negocio
  const db = adminDb();
  const { data: prof } = await db
    .from("professionals")
    .select("id")
    .eq("id", professionalId)
    .eq("business_id", businessId)
    .single();

  if (!prof) return NextResponse.json({ error: "Profissional não encontrada." }, { status: 404 });

  const { data, error } = await db
    .from("business_hours")
    .select("id, day_of_week, open_time, close_time, is_closed")
    .eq("business_id", businessId)
    .eq("professional_id", professionalId)
    .order("day_of_week", { ascending: true });

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
  if (!(await verifyAccess(businessId, role, myId, professionalId))) {
    return forbiddenJson();
  }

  const { hours } = await req.json() as { hours: HourInput[] };
  if (!Array.isArray(hours) || hours.length === 0) {
    return NextResponse.json({ error: "Horários inválidos." }, { status: 400 });
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

  // Reemplazar horarios de esta profesional
  await db
    .from("business_hours")
    .delete()
    .eq("business_id", businessId)
    .eq("professional_id", professionalId);

  const { error } = await db.from("business_hours").insert(
    hours.map((h) => ({
      business_id:     businessId,
      professional_id: professionalId,
      day_of_week:     h.day_of_week,
      open_time:       h.open_time,
      close_time:      h.close_time,
      is_closed:       h.is_closed,
    }))
  );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
