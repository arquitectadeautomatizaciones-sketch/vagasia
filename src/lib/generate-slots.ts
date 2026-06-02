/**
 * generate-slots.ts
 *
 * Genera available_slots para las próximas N semanas a partir de:
 *   - business_hours  → días y horarios de trabajo (filtrados por professional_id)
 *   - services        → uno o más servicios con su duration_minutes
 *
 * Estrategia de service_id:
 *   Se genera un slot por cada combinación (servicio × ventana horaria).
 *   El intervalo entre slots = duration_minutes del servicio.
 *   Ejemplo: servicio de 45 min → slots a 09:00, 09:45, 10:30, …
 *
 * Parámetro professionalId:
 *   - Si se pasa: genera slots solo para esa profesional usando sus propios horarios y
 *     servicios, con professional_id en cada slot insertado.
 *   - Si es undefined: genera para TODAS las profesionales activas del negocio,
 *     cada slot con su professional_id correcto. (Usado en contextos legacy / admin.)
 *
 * El endpoint /api/slots/generate y el onboarding/complete llaman esta función.
 */

import { SupabaseClient } from "@supabase/supabase-js";
import { timeToMinutes, minutesToTime } from "./availability";

interface ServiceRow {
  id: string;
  duration_minutes: number;
  name: string;
}

interface HoursRow {
  day_of_week: number;   // 0 = domingo … 6 = sábado
  open_time: string;     // "HH:MM"
  close_time: string;    // "HH:MM"
  is_closed: boolean;
}

interface SlotInsert {
  business_id: string;
  professional_id: string;
  date: string;        // "YYYY-MM-DD"
  start_time: string;  // "HH:MM"
  end_time: string;    // "HH:MM"
  service_id: string;
  status: "disponivel";
}

/** Devuelve "YYYY-MM-DD" para una fecha dada */
function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/**
 * Genera y persiste los available_slots para las próximas `weeksAhead` semanas.
 *
 * @param businessId    - ID del negocio
 * @param db            - Cliente Supabase con service role
 * @param weeksAhead    - Semanas a generar (default 4)
 * @param professionalId - Si se pasa, genera solo para esa profesional.
 *                         Si es undefined, genera para TODAS las profesionales
 *                         activas del negocio.
 *
 * @returns número de slots insertados
 */
export async function generateSlotsForBusiness(
  businessId: string,
  db: SupabaseClient,
  weeksAhead = 4,
  professionalId?: string
): Promise<{ inserted: number; error?: string }> {

  // ── Rango de fechas ──────────────────────────────────────────────────────
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() + 1);
  const endDate = new Date(today);
  endDate.setDate(endDate.getDate() + weeksAhead * 7);
  const startISO = toISODate(startDate);

  // ── Determinar qué profesionales procesar ────────────────────────────────
  let professionalsToProcess: Array<{ id: string }>;

  if (professionalId) {
    // Solo la profesional indicada
    professionalsToProcess = [{ id: professionalId }];
  } else {
    // Todas las profesionales activas del negocio
    const { data: profs, error: profErr } = await db
      .from("professionals")
      .select("id")
      .eq("business_id", businessId)
      .eq("is_active", true);
    if (profErr) return { inserted: 0, error: profErr.message };
    professionalsToProcess = profs ?? [];
    if (professionalsToProcess.length === 0) {
      return { inserted: 0, error: "Negócio sem profissionais activos." };
    }
  }

  // ── Leer servicios activos del negocio (compartidos entre profesionales) ─
  const { data: servicesData, error: svcErr } = await db
    .from("services")
    .select("id, name, duration_minutes")
    .eq("business_id", businessId)
    .eq("active", true);

  if (svcErr) return { inserted: 0, error: svcErr.message };
  const services: ServiceRow[] = servicesData ?? [];
  if (services.length === 0) {
    return { inserted: 0, error: "Negócio sem serviços activos." };
  }

  // ── Generar slots por profesional ────────────────────────────────────────
  const toInsert: SlotInsert[] = [];

  for (const prof of professionalsToProcess) {
    const pid = prof.id;

    // Leer horarios de esta profesional
    const { data: hoursData, error: hoursErr } = await db
      .from("business_hours")
      .select("day_of_week, open_time, close_time, is_closed")
      .eq("business_id", businessId)
      .eq("professional_id", pid);

    if (hoursErr) {
      console.error(`[generate-slots] Error leyendo horarios de ${pid}:`, hoursErr.message);
      continue; // saltamos esta profesional, no abortamos todo
    }

    const hours: HoursRow[] = hoursData ?? [];
    if (hours.length === 0) continue; // sin horarios → sin slots

    // Eliminar slots futuros disponibles de esta profesional
    const { error: delErr } = await db
      .from("available_slots")
      .delete()
      .eq("business_id", businessId)
      .eq("professional_id", pid)
      .eq("status", "disponivel")
      .gte("date", startISO);

    if (delErr) {
      console.error(`[generate-slots] Error limpiando slots de ${pid}:`, delErr.message);
      // No es fatal — continuamos
    }

    // Construir slots para esta profesional
    const hoursMap = new Map<number, HoursRow>(hours.map((h) => [h.day_of_week, h]));
    const cursor = new Date(startDate);

    while (cursor <= endDate) {
      const dayOfWeek = cursor.getDay();
      const dateStr   = toISODate(cursor);
      const dayHours  = hoursMap.get(dayOfWeek);

      if (dayHours && !dayHours.is_closed) {
        const openMin  = timeToMinutes(dayHours.open_time);
        const closeMin = timeToMinutes(dayHours.close_time);

        for (const svc of services) {
          const step = svc.duration_minutes;
          if (step <= 0) continue;

          let slotStart = openMin;
          while (slotStart + step <= closeMin) {
            toInsert.push({
              business_id:     businessId,
              professional_id: pid,
              date:            dateStr,
              start_time:      minutesToTime(slotStart),
              end_time:        minutesToTime(slotStart + step),
              service_id:      svc.id,
              status:          "disponivel",
            });
            slotStart += step;
          }
        }
      }

      cursor.setDate(cursor.getDate() + 1);
    }
  }

  if (toInsert.length === 0) {
    return { inserted: 0 };
  }

  // ── Insertar en lotes de 200 filas ───────────────────────────────────────
  const BATCH = 200;
  let inserted = 0;

  for (let i = 0; i < toInsert.length; i += BATCH) {
    const { error: insErr } = await db
      .from("available_slots")
      .insert(toInsert.slice(i, i + BATCH));

    if (insErr) {
      console.error("[generate-slots] Error en lote", Math.floor(i / BATCH), insErr.message);
      return { inserted, error: insErr.message };
    }
    inserted += BATCH > toInsert.length - i ? toInsert.length - i : BATCH;
  }

  return { inserted };
}
