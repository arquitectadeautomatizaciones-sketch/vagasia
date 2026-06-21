import { createSupabaseAdminClient } from "@/utils/supabase/admin";
import { NextResponse } from "next/server";
import { getAuthContext, unauthorizedJson } from "@/lib/api-auth";

export async function GET() {
  const { businessId } = await getAuthContext();
  if (!businessId) return unauthorizedJson();

  const sb = createSupabaseAdminClient();
  const today = new Date().toISOString().slice(0, 10);
  const in14days = new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10);

  const [bizRes, slotsRes, profsRes, hoursRes] = await Promise.all([
    sb.from("businesses")
      .select("is_active, trial_started_at, name")
      .eq("id", businessId)
      .single(),
    sb.from("available_slots")
      .select("date, start_time, status")
      .eq("business_id", businessId)
      .eq("status", "disponivel")
      .gte("date", today)
      .lte("date", in14days)
      .order("date")
      .order("start_time")
      .limit(50),
    sb.from("professionals")
      .select("id, name, is_active")
      .eq("business_id", businessId)
      .eq("is_active", true),
    sb.from("business_hours")
      .select("professional_id, day_of_week, is_closed")
      .eq("business_id", businessId),
  ]);

  const profs = profsRes.data ?? [];
  const hours = hoursRes.data ?? [];
  const slots = slotsRes.data ?? [];

  const slotsByDate: Record<string, number> = {};
  for (const s of slots) {
    slotsByDate[s.date] = (slotsByDate[s.date] ?? 0) + 1;
  }
  const slotDates = Object.entries(slotsByDate)
    .slice(0, 5)
    .map(([date, count]) => ({ date, count }));

  const professionals = profs.map((p) => {
    const ph = hours.filter((h) => h.professional_id === p.id);
    const hasHours = ph.some((h) => !h.is_closed);
    return { id: p.id, name: p.name, hasHours, configuredDays: ph.filter((h) => !h.is_closed).length };
  });

  return NextResponse.json({
    business: {
      isActive: bizRes.data?.is_active ?? false,
      trialStartedAt: bizRes.data?.trial_started_at ?? null,
    },
    slots: {
      totalNext14Days: slots.length,
      nextDates: slotDates,
    },
    professionals,
  });
}
