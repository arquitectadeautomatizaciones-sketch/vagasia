import { redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import AppLayout from "@/components/AppLayout";
import DashboardAgenda from "@/components/DashboardAgenda";
import DashboardTeamSection from "@/components/DashboardTeamSection";
import { getAuthContext } from "@/lib/api-auth";
import {
  CalendarCheck,
  Banknote,
  TrendingUp,
  CheckCircle,
  Clock,
  XCircle,
  Zap,
  Globe,
  Mail,
  Phone,
  MapPin,
  ArrowRight,
} from "lucide-react";
import type { Professional } from "@/lib/types";

const TRIAL_DAYS = 7;

function trialDaysRemaining(trialStartedAt: string): number {
  const elapsed = Date.now() - new Date(trialStartedAt).getTime();
  return Math.ceil(TRIAL_DAYS - elapsed / (1000 * 60 * 60 * 24));
}

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

export default async function DashboardPage() {
  const { businessId, professionalId, role } = await getAuthContext();
  if (!businessId) redirect("/login");

  const db        = adminClient();
  const todayStr  = new Date().toISOString().split("T")[0];

  // Fetch appointments for today — include professional_id for selector filtering
  // Collaborator: only their own; Owner: all
  let apptQuery = db
    .from("appointments")
    .select("id, starts_at, ends_at, status, price, professional_id, client:client_id(name), service:service_id(name)")
    .eq("business_id", businessId)
    .gte("starts_at", `${todayStr}T00:00:00`)
    .lte("starts_at", `${todayStr}T23:59:59`)
    .order("starts_at", { ascending: true });

  if (role === "collaborator" && professionalId) {
    apptQuery = apptQuery.eq("professional_id", professionalId);
  }

  const [{ data: appointmentsRaw }, { data: professionalsRaw }, { count: clientCount }, user] = await Promise.all([
    apptQuery,
    db
      .from("professionals")
      .select("id, name, role, is_active")
      .eq("business_id", businessId)
      .eq("is_active", true)
      .order("created_at", { ascending: true }),
    db
      .from("clients")
      .select("id", { count: "exact", head: true })
      .eq("business_id", businessId),
    (async () => {
      const { createSupabaseServerClient } = await import("@/utils/supabase/server");
      const supabase = await createSupabaseServerClient();
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    })(),
  ]);

  const today        = appointmentsRaw ?? [];
  const professionals: Pick<Professional, "id" | "name" | "role">[] =
    (professionalsRaw ?? []).map(({ id, name, role }) => ({ id, name, role }));

  // Metrics — always based on total today (regardless of selector)
  const confirmed        = today.filter((a) => a.status === "confirmada");
  const pending          = today.filter((a) => a.status === "pendente");
  const cancelled        = today.filter((a) => a.status === "cancelada");
  const revenue          = confirmed.reduce((s, a) => s + (a.price ?? 0), 0);
  const confirmationRate = today.length > 0 ? Math.round((confirmed.length / today.length) * 100) : 0;

  const isActive       = user?.app_metadata?.is_active === true;
  const trialStartedAt = user?.app_metadata?.trial_started_at as string | undefined;
  const daysRemaining  = trialStartedAt ? trialDaysRemaining(trialStartedAt) : 0;
  const showTrialBanner     = !isActive && trialStartedAt && daysRemaining > 0;
  const showFirstClientCard = (clientCount ?? 0) === 0 && !!trialStartedAt;

  const dateDisplay = new Date().toLocaleDateString("pt-PT", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  const metrics = [
    {
      label: "Marcações Hoje",
      value: today.length.toString(),
      sub: `${confirmed.length} confirmadas · ${pending.length} pendentes`,
      icon: CalendarCheck, accent: "#00B4D8",
    },
    {
      label: "Faturação do Dia",
      value: `€${revenue.toFixed(2)}`,
      sub: `${confirmed.length} serviço${confirmed.length !== 1 ? "s" : ""} realizado${confirmed.length !== 1 ? "s" : ""}`,
      icon: Banknote, accent: "#2DD4BF",
    },
    {
      label: "Vagas Recuperadas",
      value: confirmed.length.toString(),
      sub: `${cancelled.length} cancelamento${cancelled.length !== 1 ? "s" : ""} hoje`,
      icon: TrendingUp, accent: "#00B4D8",
    },
    {
      label: "Taxa de Confirmação",
      value: `${confirmationRate}%`,
      sub: "Marcações de hoje",
      icon: CheckCircle, accent: "#2DD4BF",
    },
  ];

  // Normalize appointments: Supabase returns joined rows as arrays, DashboardAgenda expects objects
  const appointments = (today as any[]).map(apt => ({
    ...apt,
    client:  Array.isArray(apt.client)  ? apt.client[0]  ?? null : apt.client,
    service: Array.isArray(apt.service) ? apt.service[0] ?? null : apt.service,
  }));

  return (
    <AppLayout>
      <div className="p-6 space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-xl font-semibold text-white">Dashboard</h1>
          <p className="text-sm text-slate-400 mt-0.5 capitalize">{dateDisplay}</p>
        </div>

        {/* Banner de trial */}
        {showTrialBanner && (
          <div className="flex items-center gap-3 rounded-xl border border-[#00B4D8]/20 bg-[#00B4D8]/5 px-4 py-3">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-[#00B4D8]/15">
              <Zap size={16} className="text-[#00B4D8]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white">
                {daysRemaining === 1
                  ? "Último dia de teste gratuito"
                  : `Tens ${daysRemaining} dias de teste gratuito restantes`}
              </p>
              <p className="text-xs text-slate-400">
                Após o período de teste, a subscrição é de €37/mês.
              </p>
            </div>
            <a href="/subscribe"
              className="flex-shrink-0 rounded-lg bg-[#00B4D8] px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[#0090b0]"
            >
              Subscrever
            </a>
          </div>
        )}

        {/* Tarjeta de primera acción guiada — desaparece al añadir el primer cliente */}
        {showFirstClientCard && (
          <div className="flex items-center gap-4 rounded-xl border border-[#2A9D8F]/30 bg-[#2A9D8F]/8 px-5 py-4">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#2A9D8F]/20 text-lg">
              ✅
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white">
                Agenda configurada — 4 semanas prontas
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                👉 Próximo passo: adiciona o teu primeiro cliente e vê o sistema funcionar
              </p>
            </div>
            <a
              href="/clientes"
              className="flex-shrink-0 flex items-center gap-1.5 rounded-lg bg-[#2A9D8F] px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#1F7A6E]"
            >
              Adicionar cliente <ArrowRight size={13} />
            </a>
          </div>
        )}

        {/* Metric cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {metrics.map((m) => {
            const Icon = m.icon;
            return (
              <div key={m.label} className="rounded-xl border border-white/5 bg-[#1E293B] p-5">
                <div className="flex items-start justify-between">
                  <p className="text-xs text-slate-400 font-medium">{m.label}</p>
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg"
                    style={{ backgroundColor: m.accent + "22" }}>
                    <Icon size={16} style={{ color: m.accent }} />
                  </div>
                </div>
                <p className="mt-3 text-2xl font-bold text-white">{m.value}</p>
                <p className="mt-1 text-xs text-slate-500">{m.sub}</p>
              </div>
            );
          })}
        </div>

        {/* Agenda con selector de profesional */}
        <DashboardAgenda
          appointments={appointments}
          professionals={professionals}
          myProfId={professionalId}
          role={role}
        />

        {/* Card / Panel del colaborador — solo para owners */}
        {role === "owner" && (
          <DashboardTeamSection
            professionals={professionals}
          />
        )}

        {/* Sección de soporte */}
        <div className="rounded-xl border border-[#2DD4BF]/20 bg-[#0F172A]/60 p-6">
          <h2 className="mb-4 text-sm font-semibold text-white">
            Precisas de ajuda? Estamos sempre aqui 💚
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <a href="https://dianagarcia.pt/home" target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-300 transition-colors hover:bg-white/5 hover:text-white"
            ><Globe size={15} className="shrink-0 text-[#2DD4BF]" /> dianagarcia.pt/home</a>
            <a href="mailto:geral@dianagarcia.pt"
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-300 transition-colors hover:bg-white/5 hover:text-white"
            ><Mail size={15} className="shrink-0 text-[#2DD4BF]" /> geral@dianagarcia.pt</a>
            <a href="tel:+351911816539"
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-300 transition-colors hover:bg-white/5 hover:text-white"
            ><Phone size={15} className="shrink-0 text-[#2DD4BF]" /> +351 911 816 539</a>
            <div className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-300">
              <MapPin size={15} className="shrink-0 text-[#2DD4BF]" /> Viana do Castelo, Portugal
            </div>
          </div>
          <p className="mt-4 text-xs text-slate-500">
            A nossa equipa responde de segunda a sexta, mas a Sofía está disponível 24/7.
          </p>
        </div>

      </div>
    </AppLayout>
  );
}
