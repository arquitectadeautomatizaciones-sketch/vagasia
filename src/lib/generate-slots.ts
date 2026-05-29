/**
 * generate-slots.ts
 *
 * Genera available_slots para las próximas N semanas a partir de:
 *   - business_hours  → días y horarios de trabajo
 *   - services        → uno o más servicios con su duration_minutes
 *
 * Estrategia de service_id:
 *   Se genera un slot por cada combinación (servicio × ventana horaria).
 *   El intervalo entre slots = duration_minutes del servicio.
 *   Ejemplo: servicio de 45 min → slots a 09:00, 09:45, 10:30, …
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
 * Antes de insertar elimina todos los slots `disponivel` futuros del negocio
 * (evita duplicados si se llama más de una vez).
 *
 * @returns número de slots insertados
 */
export async function generateSlotsForBusiness(
  businessId: string,
  db: SupabaseClient,
  weeksAhead = 4
): Promise<{ inserted: number; error?: string }> {
  // 1. Leer horarios del negocio
  const { data: hoursData, error: hoursErr } = await db
    .from("business_hours")
    .select("day_of_week, open_time, close_time, is_closed")
    .eq("business_id", businessId);

  if (hoursErr) return { inserted: 0, error: hoursErr.message };
  const hours: HoursRow[] = hoursData ?? [];

  if (hours.length === 0) {
    return { inserted: 0, error: "Negócio sem horários configurados." };
  }

  // 2. Leer servicios activos del negocio
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

  // 3. Rango de fechas: mañana → hoy + (weeksAhead × 7) días
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() + 1); // empezar mañana

  const endDate = new Date(today);
  endDate.setDate(endDate.getDate() + weeksAhead * 7);

  // 4. Eliminar slots futuros disponibles para evitar duplicados
  const startISO = toISODate(startDate);
  const { error: delErr } = await db
    .from("available_slots")
    .delete()
    .eq("business_id", businessId)
    .eq("status", "disponivel")
    .gte("date", startISO);

  if (delErr) {
    console.error("[generate-slots] Error al limpiar slots anteriores:", delErr.message);
    // No es fatal — continuamos igualmente
  }

  // 5. Construir array de slots a insertar
  const toInsert: SlotInsert[] = [];
  const hoursMap = new Map<number, HoursRow>(
    hours.map((h) => [h.day_of_week, h])
  );

  const cursor = new Date(startDate);
  while (cursor <= endDate) {
    const dayOfWeek = cursor.getDay();
    const dateStr = toISODate(cursor);
    const dayHours = hoursMap.get(dayOfWeek);

    if (dayHours && !dayHours.is_closed) {
      const openMin  = timeToMinutes(dayHours.open_time);
      const closeMin = timeToMinutes(dayHours.close_time);

      for (const svc of services) {
        const step = svc.duration_minutes;
        if (step <= 0) continue;

        let slotStart = openMin;
        while (slotStart + step <= closeMin) {
          const slotEnd = slotStart + step;
          toInsert.push({
            business_id: businessId,
            date: dateStr,
            start_time: minutesToTime(slotStart),
            end_time:   minutesToTime(slotEnd),
            service_id: svc.id,
            status:     "disponivel",
          });
          slotStart = slotEnd;
        }
      }
    }

    cursor.setDate(cursor.getDate() + 1);
  }

  if (toInsert.length === 0) {
    return { inserted: 0 };
  }

  // 6. Insertar en lotes de 200 filas
  const BATCH = 200;
  let inserted = 0;
  for (let i = 0; i < toInsert.length; i += BATCH) {
    const batch = toInsert.slice(i, i + BATCH);
    const { error: insErr } = await db
      .from("available_slots")
      .insert(batch);

    if (insErr) {
      console.error("[generate-slots] Error en lote", i / BATCH, insErr.message);
      return { inserted, error: insErr.message };
    }
    inserted += batch.length;
  }

  return { inserted };
}
