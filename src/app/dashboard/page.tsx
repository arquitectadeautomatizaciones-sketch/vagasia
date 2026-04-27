import AppLayout from "@/components/AppLayout";
import { mockAppointments } from "@/lib/mock-data";
import {
  CalendarCheck,
  Banknote,
  TrendingUp,
  CheckCircle,
  Clock,
  XCircle,
} from "lucide-react";

function statusColors(status: string) {
  if (status === "confirmada") return "bg-[#2DD4BF]/15 text-[#2DD4BF]";
  if (status === "pendente") return "bg-yellow-500/15 text-yellow-400";
  return "bg-red-500/15 text-red-400";
}

function statusLabel(status: string) {
  if (status === "confirmada") return "Confirmada";
  if (status === "pendente") return "Pendente";
  return "Cancelada";
}

function StatusIcon({ status }: { status: string }) {
  if (status === "confirmada") return <CheckCircle size={13} />;
  if (status === "pendente") return <Clock size={13} />;
  return <XCircle size={13} />;
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" });
}

export default function DashboardPage() {
  const today = mockAppointments;
  const confirmed = today.filter((a) => a.status === "confirmada");
  const pending = today.filter((a) => a.status === "pendente");
  const cancelled = today.filter((a) => a.status === "cancelada");
  const revenue = confirmed.reduce((sum, a) => sum + a.price, 0);
  const confirmationRate = Math.round((confirmed.length / today.length) * 100);
  const recovered = confirmed.length;

  const metrics = [
    {
      label: "Marcações Hoje",
      value: today.length.toString(),
      sub: `${confirmed.length} confirmadas · ${pending.length} pendentes`,
      icon: CalendarCheck,
      accent: "#00B4D8",
    },
    {
      label: "Faturação do Dia",
      value: `€${revenue}`,
      sub: `${confirmed.length} serviços realizados`,
      icon: Banknote,
      accent: "#2DD4BF",
    },
    {
      label: "Vagas Recuperadas",
      value: recovered.toString(),
      sub: `${cancelled.length} cancelamento${cancelled.length !== 1 ? "s" : ""} hoje`,
      icon: TrendingUp,
      accent: "#00B4D8",
    },
    {
      label: "Taxa de Confirmação",
      value: `${confirmationRate}%`,
      sub: "Últimas 30 marcações",
      icon: CheckCircle,
      accent: "#2DD4BF",
    },
  ];

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-xl font-semibold text-white">Dashboard</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Sábado, 26 de abril de 2026
          </p>
        </div>

        {/* Metric cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {metrics.map((m) => {
            const Icon = m.icon;
            return (
              <div
                key={m.label}
                className="rounded-xl border border-white/5 bg-[#1E293B] p-5"
              >
                <div className="flex items-start justify-between">
                  <p className="text-xs text-slate-400 font-medium">{m.label}</p>
                  <div
                    className="flex h-8 w-8 items-center justify-center rounded-lg"
                    style={{ backgroundColor: m.accent + "22" }}
                  >
                    <Icon size={16} style={{ color: m.accent }} />
                  </div>
                </div>
                <p className="mt-3 text-2xl font-bold text-white">{m.value}</p>
                <p className="mt-1 text-xs text-slate-500">{m.sub}</p>
              </div>
            );
          })}
        </div>

        {/* Today's appointments */}
        <div className="rounded-xl border border-white/5 bg-[#1E293B]">
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
            <h2 className="text-sm font-semibold text-white">Agenda de Hoje</h2>
            <a href="/marcacoes" className="text-xs text-[#00B4D8] hover:underline">
              Ver tudo
            </a>
          </div>
          <div className="divide-y divide-white/5">
            {today.map((appt) => (
              <div key={appt.id} className="flex items-center gap-4 px-5 py-3.5">
                <div className="w-16 text-center">
                  <p className="text-xs font-medium text-slate-300">
                    {formatTime(appt.starts_at)}
                  </p>
                  <p className="text-[10px] text-slate-600">
                    {formatTime(appt.ends_at)}
                  </p>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {appt.client?.name}
                  </p>
                  <p className="text-xs text-slate-500 truncate">
                    {appt.service?.name}
                  </p>
                </div>
                <p className="text-sm font-semibold text-slate-300">
                  €{appt.price}
                </p>
                <span
                  className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium ${statusColors(appt.status)}`}
                >
                  <StatusIcon status={appt.status} />
                  {statusLabel(appt.status)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
