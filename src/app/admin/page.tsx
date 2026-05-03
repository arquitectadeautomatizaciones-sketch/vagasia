"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Zap, Loader2, Users, CheckCircle2, XCircle,
  Power, PowerOff, Check, X, LogOut, Building2,
} from "lucide-react";
import { createBrowserClient } from "@supabase/ssr";

interface Negocio {
  business_id: string;
  business_name: string;
  auth_user_id: string | null;
  category: string;
  phone: string;
  email: string;
  whatsapp_number: string | null;
  is_active: boolean;
  created_at: string;
  user_name: string | null;
  user_email: string | null;
  user_created_at: string | null;
  onboarding_completed: boolean;
}

type SaveState = "idle" | "saving" | "saved" | "error";

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function EstadoBadge({ activo }: { activo: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
        activo
          ? "bg-[#2DD4BF]/15 text-[#2DD4BF]"
          : "bg-red-500/15 text-red-400"
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${activo ? "bg-[#2DD4BF]" : "bg-red-400"}`} />
      {activo ? "Activo" : "Inactivo"}
    </span>
  );
}

function ToggleActivo({
  businessId,
  activo,
  onChange,
}: {
  businessId: string;
  activo: boolean;
  onChange: (id: string, nuevoEstado: boolean) => void;
}) {
  const [state, setState] = useState<SaveState>("idle");

  async function toggle() {
    setState("saving");
    try {
      const res = await fetch(`/api/admin/businesses/${businessId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !activo }),
      });
      if (!res.ok) { setState("error"); return; }
      onChange(businessId, !activo);
      setState("saved");
      setTimeout(() => setState("idle"), 2000);
    } catch {
      setState("error");
      setTimeout(() => setState("idle"), 2000);
    }
  }

  if (state === "saving") {
    return (
      <div className="flex h-8 w-8 items-center justify-center">
        <Loader2 size={15} className="animate-spin text-slate-500" />
      </div>
    );
  }

  if (state === "error") {
    return (
      <span
        title="Error al actualizar"
        className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/15 text-red-400"
      >
        <X size={14} />
      </span>
    );
  }

  return (
    <button
      onClick={toggle}
      title={activo ? "Desactivar negocio" : "Activar negocio"}
      className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
        activo
          ? "bg-red-500/10 text-red-400 hover:bg-red-500/20"
          : "bg-[#2DD4BF]/10 text-[#2DD4BF] hover:bg-[#2DD4BF]/20"
      }`}
    >
      {activo ? <PowerOff size={13} /> : <Power size={13} />}
      {activo ? "Desactivar" : "Activar"}
    </button>
  );
}

function WhatsAppEditor({
  businessId,
  initial,
}: {
  businessId: string;
  initial: string | null;
}) {
  const [value, setValue] = useState(initial ?? "");
  const [state, setState] = useState<SaveState>("idle");
  const [errMsg, setErrMsg] = useState("");

  async function save() {
    setState("saving");
    setErrMsg("");
    try {
      const res = await fetch(`/api/admin/professionals/${businessId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ whatsapp_number: value.trim() || null }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setErrMsg(data.error ?? "Error"); setState("error"); return; }
      setState("saved");
      setTimeout(() => setState("idle"), 2000);
    } catch {
      setState("error");
    }
  }

  const dirty = value.trim() !== (initial ?? "");

  return (
    <div className="flex items-center gap-2 min-w-[200px]">
      <input
        type="text"
        placeholder="+57XXXXXXXXXX"
        value={value}
        onChange={(e) => { setValue(e.target.value); setState("idle"); }}
        className="flex-1 rounded-lg border border-white/10 bg-[#0F172A] px-3 py-1.5 text-sm text-white placeholder-slate-600 focus:border-[#00B4D8] focus:outline-none"
      />
      {dirty && state !== "saved" && (
        <button
          onClick={save}
          disabled={state === "saving"}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#00B4D8] text-white transition-colors hover:bg-[#0090b0] disabled:opacity-50"
        >
          {state === "saving" ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
        </button>
      )}
      {state === "saved" && (
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#2DD4BF]/15 text-[#2DD4BF]">
          <Check size={13} />
        </span>
      )}
      {state === "error" && (
        <span title={errMsg} className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-red-500/15 text-red-400">
          <X size={13} />
        </span>
      )}
    </div>
  );
}

export default function AdminPage() {
  const [negocios, setNegocios] = useState<Negocio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function handleLogout() {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  const handleToggle = useCallback((id: string, nuevoEstado: boolean) => {
    setNegocios((prev) =>
      prev.map((n) => (n.business_id === id ? { ...n, is_active: nuevoEstado } : n))
    );
  }, []);

  useEffect(() => {
    fetch("/api/admin/professionals")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setNegocios(data);
        else setError(data.error ?? "Error al cargar datos.");
      })
      .catch(() => setError("Error de red."))
      .finally(() => setLoading(false));
  }, []);

  const total = negocios.length;
  const activos = negocios.filter((n) => n.is_active).length;
  const inactivos = total - activos;

  const stats = [
    { label: "Total negocios",  value: total,    icon: Building2,    color: "#00B4D8" },
    { label: "Activos",         value: activos,  icon: CheckCircle2, color: "#2DD4BF" },
    { label: "Inactivos",       value: inactivos, icon: XCircle,     color: "#f87171" },
  ];

  return (
    <div className="min-h-screen bg-[#0F172A]">
      {/* Header */}
      <div className="border-b border-white/5 bg-[#1E293B]">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#00B4D8]">
                <Zap size={18} className="text-white" fill="white" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">VagasIA</p>
                <p className="text-[11px] text-slate-500">Panel de Administración</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-slate-400 transition-colors hover:bg-white/5 hover:text-white"
            >
              <LogOut size={15} />
              Cerrar sesión
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-8 space-y-6">

        {/* Título */}
        <div>
          <h1 className="text-xl font-bold text-white">Negocios registrados</h1>
          <p className="mt-0.5 text-sm text-slate-400">
            Gestiona el acceso de cada negocio a VagasIA
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {stats.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="rounded-xl border border-white/5 bg-[#1E293B] p-5">
                <div className="flex items-start justify-between">
                  <p className="text-xs font-medium text-slate-400">{s.label}</p>
                  <div
                    className="flex h-8 w-8 items-center justify-center rounded-lg"
                    style={{ backgroundColor: s.color + "22" }}
                  >
                    <Icon size={16} style={{ color: s.color }} />
                  </div>
                </div>
                <p className="mt-3 text-3xl font-bold text-white">
                  {loading ? "—" : s.value}
                </p>
              </div>
            );
          })}
        </div>

        {/* Tabla */}
        <div className="rounded-xl border border-white/5 bg-[#1E293B]">
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
            <h2 className="text-sm font-semibold text-white">
              Lista de negocios
            </h2>
            {!loading && (
              <p className="text-xs text-slate-500">
                {total} {total === 1 ? "negocio" : "negocios"} en total
              </p>
            )}
          </div>

          {loading && (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={24} className="animate-spin text-slate-500" />
            </div>
          )}

          {!loading && error && (
            <p className="px-6 py-8 text-center text-sm text-red-400">{error}</p>
          )}

          {!loading && !error && negocios.length === 0 && (
            <p className="px-6 py-8 text-center text-sm text-slate-500">
              No hay negocios registrados.
            </p>
          )}

          {!loading && !error && negocios.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    <th className="px-6 py-3">Negocio</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Registro</th>
                    <th className="px-4 py-3 text-center">Onboarding</th>
                    <th className="px-4 py-3">Estado</th>
                    <th className="px-4 py-3">WhatsApp</th>
                    <th className="px-4 py-3">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {negocios.map((n) => (
                    <tr
                      key={n.business_id}
                      className={`transition-colors hover:bg-white/[0.02] ${
                        !n.is_active ? "opacity-60" : ""
                      }`}
                    >
                      {/* Negocio */}
                      <td className="px-6 py-4">
                        <p className="font-medium text-white">
                          {n.user_name ?? "—"}
                        </p>
                        <p className="text-xs text-slate-500">
                          {n.business_name} · {n.category}
                        </p>
                      </td>

                      {/* Email */}
                      <td className="px-4 py-4 text-slate-400">
                        {n.user_email ?? n.email ?? "—"}
                      </td>

                      {/* Fecha registro */}
                      <td className="px-4 py-4 text-slate-400">
                        {formatDate(n.user_created_at)}
                      </td>

                      {/* Onboarding */}
                      <td className="px-4 py-4 text-center">
                        {n.onboarding_completed ? (
                          <Check size={15} className="mx-auto text-[#2DD4BF]" />
                        ) : (
                          <X size={15} className="mx-auto text-slate-600" />
                        )}
                      </td>

                      {/* Estado activo/inactivo */}
                      <td className="px-4 py-4">
                        <EstadoBadge activo={n.is_active} />
                      </td>

                      {/* WhatsApp */}
                      <td className="px-4 py-4">
                        <WhatsAppEditor
                          businessId={n.business_id}
                          initial={n.whatsapp_number}
                        />
                      </td>

                      {/* Botón activar/desactivar */}
                      <td className="px-4 py-4">
                        <ToggleActivo
                          businessId={n.business_id}
                          activo={n.is_active}
                          onChange={handleToggle}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-slate-700">
          Panel exclusivo para administradoras · VagasIA
        </p>
      </div>
    </div>
  );
}
