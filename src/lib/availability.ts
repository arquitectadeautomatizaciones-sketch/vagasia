import type { BusinessHours, AvailabilityException, Appointment } from "./types";

export function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

export function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function dateToString(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/**
 * Returns available start times for booking on a given date.
 * Algorithm uses a boolean minute grid (1440 slots) to merge/subtract ranges.
 */
export function getAvailableSlots(
  dateStr: string,
  businessHours: BusinessHours[],
  exceptions: AvailabilityException[],
  appointments: Appointment[],
  serviceDurationMinutes: number,
  intervalMinutes = 30
): string[] {
  const date = new Date(dateStr + "T12:00:00");
  const dayOfWeek = date.getDay();
  const baseHours = businessHours.find((h) => h.day_of_week === dayOfWeek);

  const grid = new Uint8Array(1440); // 1 = available

  // 1. Apply base schedule
  if (baseHours && !baseHours.is_closed) {
    const s = timeToMinutes(baseHours.open_time);
    const e = timeToMinutes(baseHours.close_time);
    grid.fill(1, s, e);
  }

  const dayExceptions = exceptions.filter((ex) => ex.date === dateStr);

  // 2. Add open exceptions (expand availability)
  for (const ex of dayExceptions.filter((ex) => ex.type === "open")) {
    const s = timeToMinutes(ex.start_time);
    const e = timeToMinutes(ex.end_time);
    grid.fill(1, s, e);
  }

  // 3. Subtract block exceptions (remove availability)
  for (const ex of dayExceptions.filter((ex) => ex.type === "block")) {
    const s = timeToMinutes(ex.start_time);
    const e = timeToMinutes(ex.end_time);
    grid.fill(0, s, e);
  }

  // 4. Subtract confirmed/pending appointments
  for (const appt of appointments) {
    if (appt.status === "cancelada") continue;
    const apptDate = appt.starts_at.slice(0, 10);
    if (apptDate !== dateStr) continue;
    const s = timeToMinutes(appt.starts_at.slice(11, 16));
    const e = timeToMinutes(appt.ends_at.slice(11, 16));
    grid.fill(0, s, e);
  }

  // 5. Generate valid start times (entire service window must be free)
  const slots: string[] = [];
  for (let i = 0; i <= 1440 - serviceDurationMinutes; i += intervalMinutes) {
    let free = true;
    for (let j = i; j < i + serviceDurationMinutes; j++) {
      if (!grid[j]) { free = false; break; }
    }
    if (free) slots.push(minutesToTime(i));
  }

  return slots;
}

/** Returns computed availability ranges for a day (for display purposes). */
export function getDayRanges(
  dateStr: string,
  businessHours: BusinessHours[],
  exceptions: AvailabilityException[]
): { start: string; end: string }[] {
  const date = new Date(dateStr + "T12:00:00");
  const dayOfWeek = date.getDay();
  const baseHours = businessHours.find((h) => h.day_of_week === dayOfWeek);

  const grid = new Uint8Array(1440);

  if (baseHours && !baseHours.is_closed) {
    grid.fill(1, timeToMinutes(baseHours.open_time), timeToMinutes(baseHours.close_time));
  }

  const dayExceptions = exceptions.filter((ex) => ex.date === dateStr);
  for (const ex of dayExceptions.filter((ex) => ex.type === "open")) {
    grid.fill(1, timeToMinutes(ex.start_time), timeToMinutes(ex.end_time));
  }
  for (const ex of dayExceptions.filter((ex) => ex.type === "block")) {
    grid.fill(0, timeToMinutes(ex.start_time), timeToMinutes(ex.end_time));
  }

  const ranges: { start: string; end: string }[] = [];
  let inRange = false;
  let rangeStart = 0;
  for (let i = 0; i <= 1440; i++) {
    const val = i < 1440 ? grid[i] : 0;
    if (!inRange && val) { inRange = true; rangeStart = i; }
    else if (inRange && !val) { inRange = false; ranges.push({ start: minutesToTime(rangeStart), end: minutesToTime(i) }); }
  }
  return ranges;
}

/** Returns true if the day has any availability (base or open exceptions minus blocks). */
export function isDayAvailable(
  dateStr: string,
  businessHours: BusinessHours[],
  exceptions: AvailabilityException[]
): boolean {
  return getDayRanges(dateStr, businessHours, exceptions).length > 0;
}
