/**
 * POST /api/team/invite
 *
 * Crea una colaboradora, guarda sus servicios y horarios, genera sus slots
 * y envía el email de invitación con un link único /invite/[token].
 *
 * Solo el owner puede invitar colaboradoras.
 * Límite: máximo 2 profesionales por negocio (owner + 1 collaborator).
 *
 * Body:
 * {
 *   name: string,
 *   email: string,
 *   services: Array<{ name, duration_minutes, price }>,
 *   hours: Array<{ day_of_week, open_time, close_time, is_closed }>,
 * }
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getAuthContext, unauthorizedJson, forbiddenJson } from "@/lib/api-auth";
import { generateSlotsForBusiness } from "@/lib/generate-slots";

function adminDb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

/** Envía el email de invitación via Resend — mismo patrón que stripe/webhook */
async function sendInviteEmail(payload: {
  toEmail: string;
  collaboratorName: string;
  ownerName: string;
  businessName: string;
  inviteUrl: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("[team/invite] RESEND_API_KEY não configurada — email omitido.");
    return;
  }

  const { toEmail, collaboratorName, ownerName, businessName, inviteUrl } = payload;

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "VagasIA <noreply@vagasia.pt>",
      to: toEmail,
      subject: `${ownerName} convidou-te para o VagasIA`,
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;background:#0F172A;color:#e2e8f0;border-radius:16px">
          <h1 style="color:#00B4D8;font-size:22px;margin-bottom:8px">VagasIA</h1>
          <p style="color:#94a3b8;font-size:13px;margin-top:0">Sistema de Gestão</p>
          <hr style="border-color:#1e293b;margin:24px 0"/>
          <h2 style="font-size:18px;font-weight:700;color:#f1f5f9">
            Olá, ${collaboratorName}! 👋
          </h2>
          <p style="color:#94a3b8;line-height:1.6">
            <strong style="color:#f1f5f9">${ownerName}</strong> convidou-te para te juntares
            a <strong style="color:#f1f5f9">${businessName}</strong> no VagasIA.
          </p>
          <p style="color:#94a3b8;line-height:1.6">
            Clica no botão abaixo para criares a tua conta e começares a gerir
            a tua agenda — os teus horários e serviços já estão configurados!
          </p>
          <a href="${inviteUrl}"
             style="display:inline-block;margin-top:16px;padding:14px 28px;background:#00B4D8;color:#fff;font-weight:700;border-radius:10px;text-decoration:none;font-size:15px">
            Aceitar convite
          </a>
          <p style="margin-top:24px;color:#475569;font-size:13px;line-height:1.5">
            Se não esperavas este convite, ignora este email.
            O link expira em 7 dias.
          </p>
          <hr style="border-color:#1e293b;margin:24px 0"/>
          <p style="font-size:12px;color:#475569">
            Questões? Contacta-nos em geral@dianagarcia.pt
          </p>
        </div>
      `,
    }),
  });
}

interface ServiceInput {
  name: string;
  duration_minutes: number;
  price: number;
}

interface HourInput {
  day_of_week: number;
  open_time: string;
  close_time: string;
  is_closed: boolean;
}

/** Appointment con service_index en lugar de service_id (se resuelve tras crear los servicios) */
interface ApptInput {
  client_name: string;
  client_phone: string;
  service_index: number; // índice en el array de services
  date: string;          // YYYY-MM-DD
  time: string;          // HH:MM
}

function addMinutes(date: string, time: string, minutes: number): string {
  const [h, m] = time.split(":").map(Number);
  const total = h * 60 + m + minutes;
  const eh = Math.floor(total / 60) % 24;
  const em = total % 60;
  return `${date}T${String(eh).padStart(2, "0")}:${String(em).padStart(2, "0")}:00`;
}

export async function POST(req: NextRequest) {
  const { businessId, professionalId: ownerProfId, role } = await getAuthContext();
  if (!businessId) return unauthorizedJson();
  if (role !== "owner") return forbiddenJson();

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Pedido inválido." }, { status: 400 });

  const { name, email, services, hours, appointments } = body as {
    name?: string;
    email?: string;
    services?: ServiceInput[];
    hours?: HourInput[];
    appointments?: ApptInput[];
  };

  // Validaciones básicas
  if (!name?.trim())  return NextResponse.json({ error: "Nome é obrigatório." }, { status: 400 });
  if (!email?.trim()) return NextResponse.json({ error: "Email é obrigatório." }, { status: 400 });
  if (!Array.isArray(services) || services.filter((s) => s.name?.trim()).length === 0) {
    return NextResponse.json({ error: "Adiciona pelo menos um serviço." }, { status: 400 });
  }
  if (!Array.isArray(hours) || hours.length === 0) {
    return NextResponse.json({ error: "Configura os horários." }, { status: 400 });
  }

  const db = adminDb();

  // Verificar que no superamos el límite de 2 profesionales (owner + 1 collaborator)
  const { data: existingProfs } = await db
    .from("professionals")
    .select("id")
    .eq("business_id", businessId)
    .eq("is_active", true);

  if ((existingProfs?.length ?? 0) >= 2) {
    return NextResponse.json(
      { error: "Limite de 2 profissionais por negócio atingido." },
      { status: 409 }
    );
  }

  // Verificar que el email no tiene ya una invitación pendiente para este negocio
  const { data: existingInvite } = await db
    .from("team_invitations")
    .select("id")
    .eq("business_id", businessId)
    .eq("email", email.trim().toLowerCase())
    .eq("status", "pending")
    .maybeSingle();

  if (existingInvite) {
    return NextResponse.json(
      { error: "Já existe um convite pendente para este email." },
      { status: 409 }
    );
  }

  // Leer datos del owner para el email
  const { data: ownerProf } = await db
    .from("professionals")
    .select("name")
    .eq("id", ownerProfId!)
    .single();

  const { data: business } = await db
    .from("businesses")
    .select("name")
    .eq("id", businessId)
    .single();

  // ── Crear professional collaborator (user_id null hasta que acepte) ──
  const { data: collaborator, error: profError } = await db
    .from("professionals")
    .insert({
      business_id: businessId,
      user_id:     null,
      name:        name.trim(),
      role:        "collaborator",
      is_active:   true,
    })
    .select("id")
    .single();

  if (profError || !collaborator) {
    return NextResponse.json({ error: "Erro ao criar perfil da colaboradora." }, { status: 500 });
  }

  const collabId = collaborator.id;

  // ── Guardar servicios de la colaboradora ──
  const validServices = services.filter((s) => s.name?.trim());
  const { error: svcError } = await db.from("services").insert(
    validServices.map((s) => ({
      business_id:      businessId,
      professional_id:  collabId,
      name:             s.name.trim(),
      duration_minutes: Number(s.duration_minutes),
      price:            Number(s.price),
      active:           true,
    }))
  );

  if (svcError) {
    // Rollback: eliminar professional creado
    await db.from("professionals").delete().eq("id", collabId);
    return NextResponse.json({ error: "Erro ao guardar serviços." }, { status: 500 });
  }

  // ── Guardar horarios de la colaboradora ──
  const { error: hoursError } = await db.from("business_hours").insert(
    hours.map((h) => ({
      business_id:     businessId,
      professional_id: collabId,
      day_of_week:     h.day_of_week,
      open_time:       h.open_time,
      close_time:      h.close_time,
      is_closed:       h.is_closed,
    }))
  );

  if (hoursError) {
    await db.from("services").delete().eq("professional_id", collabId);
    await db.from("professionals").delete().eq("id", collabId);
    return NextResponse.json({ error: "Erro ao guardar horários." }, { status: 500 });
  }

  // ── Crear appointments iniciales si los proporcionaron ──────────────────
  if (Array.isArray(appointments) && appointments.length > 0) {
    // Leer los servicios recién creados para mapear índice → id
    const { data: createdSvcs } = await db
      .from("services")
      .select("id, name, duration_minutes, price")
      .eq("business_id", businessId)
      .eq("professional_id", collabId);

    const svcList = createdSvcs ?? [];

    for (const appt of appointments) {
      if (!appt.client_name?.trim() || !appt.client_phone?.trim() || !appt.date || !appt.time) continue;
      const svc = svcList[appt.service_index];
      if (!svc) continue;

      const phone = appt.client_phone.trim();
      const { data: existing } = await db
        .from("clients")
        .select("id")
        .eq("business_id", businessId)
        .eq("phone", phone)
        .maybeSingle();

      let clientId = existing?.id as string | undefined;
      if (!clientId) {
        const { data: newClient } = await db
          .from("clients")
          .insert({ business_id: businessId, name: appt.client_name.trim(), phone, total_appointments: 0, total_spent: 0 })
          .select("id")
          .single();
        clientId = newClient?.id;
      }
      if (!clientId) continue;

      const starts_at = `${appt.date}T${appt.time}:00`;
      const ends_at   = addMinutes(appt.date, appt.time, svc.duration_minutes);

      await db.from("appointments").insert({
        business_id:     businessId,
        professional_id: collabId,
        client_id:       clientId,
        service_id:      svc.id,
        starts_at,
        ends_at,
        status: "pendente",
        price:  svc.price,
      });
    }
  }

  // ── Generar available_slots para la colaboradora (silencioso si falla) ──
  try {
    const slotResult = await generateSlotsForBusiness(businessId, db, 4, collabId);
    if (slotResult.error) {
      console.error("[team/invite] Error generando slots:", slotResult.error);
    } else {
      console.info(`[team/invite] Slots generados para colaboradora: ${slotResult.inserted}`);
    }
  } catch (e) {
    console.error("[team/invite] Excepción generando slots:", e);
  }

  // ── Crear invitación con token único ──
  const { data: invitation, error: invError } = await db
    .from("team_invitations")
    .insert({
      business_id:     businessId,
      professional_id: collabId,
      email:           email.trim().toLowerCase(),
      status:          "pending",
    })
    .select("token")
    .single();

  if (invError || !invitation) {
    return NextResponse.json({ error: "Erro ao criar convite." }, { status: 500 });
  }

  // ── Enviar email (fire-and-forget — no bloquea la respuesta) ──
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://vagasia.vercel.app";
  const inviteUrl = `${baseUrl}/invite/${invitation.token}`;

  sendInviteEmail({
    toEmail:          email.trim().toLowerCase(),
    collaboratorName: name.trim(),
    ownerName:        ownerProf?.name ?? "A tua colega",
    businessName:     business?.name  ?? "o negócio",
    inviteUrl,
  }).catch(console.error);

  return NextResponse.json({
    success:        true,
    professionalId: collabId,
    inviteToken:    invitation.token,
    inviteUrl,
  }, { status: 201 });
}
