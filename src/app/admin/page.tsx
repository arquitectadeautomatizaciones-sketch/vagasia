"use client";

import { useState, useEffect } from "react";
import { Zap, Check, X, Loader2, Users, Wifi, Clock, LogOut } from "lucide-react";
import { createBrowserClient } from "@supabase/ssr";

interface Professional {
  business_id: string;
  business_name: string;
  category: string;
  phone: string;
  email: string;
  whatsapp_number: string | null;
  whatsapp_phone_number_id: string | null;
  created_at: string;
  user_name: string | null;
  user_email: string | null;
  user_created_at: string | null;
  onboarding_completed: boolean;
}

type SaveState = "idle" | "saving" | "saved" | "error";

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-PT", { day: "2-digit", month: "short", year: "numeric" });
}

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
        active ? "bg-[#2DD4BF]/15 text-[#2DD4BF]" : "bg-yellow-500/15 text-yellow-400"
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${active ? "bg-[#2DD4BF]" : "bg-yellow-400"}`} />
      {active ? "Ativa" : "Pendente"}
    </span>
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
      if (!res.ok) { setErrMsg(data.error ?? "Erro"); setState("error"); return; }
      setState("saved");
      setTimeout(() => setState("idle"), 2000);
    } catch {
      setState("error");
    }
  }

  const dirty = value.trim() !== (initial ?? "");

  return (
    <div className="flex items-center gap-2 min-w-[220px]">
      <input
        type="text"
        placeholder="+351XXXXXXXXX"
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
  const [professionals, setProfessionals] = useState<Professional[]>([]);
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

  useEffect(() => {
    fetch("/api/admin/professionals")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setProfessionals(data);
        else setError(data.error ?? "Erro ao carregar dados.");
      })
      .catch(() => setError("Erro de rede."))
      .finally(() => setLoading(false));
  }, []);

  const total = professionals.length;
  const ativas = professionals.filter((p) => !!p.whatsapp_number).length;
  const pendentes = total - ativas;

  const stats = [
    { label: "Total",     value: total,    icon: Users, color: "#00B4D8" },
    { label: "Ativas",    value: ativas,   icon: Wifi,  color: "#2DD4BF" },
    { label: "Pendentes", value: pendentes, icon: Clock, color: "#F59E0B" },
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
                <p className="text-[11px] text-slate-500">Painel de Administração</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-slate-400 transition-colors hover:bg-white/5 hover:text-white"
            >
              <LogOut size={15} />
              Terminar Sessão
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Stats */}
        <div className="mb-8 grid grid-cols-3 gap-4">
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
                <p className="mt-3 text-3xl font-bold text-white">{loading ? "—" : s.value}</p>
              </div>
            );
          })}
        </div>

        {/* Table */}
        <div className="rounded-xl border border-white/5 bg-[#1E293B]">
          <div className="px-6 py-4 border-b border-white/5">
            <h2 className="text-sm font-semibold text-white">Profissionais Registadas</h2>
          </div>

          {loading && (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={24} className="animate-spin text-slate-500" />
            </div>
          )}

          {!loading && error && (
            <p className="px-6 py-8 text-center text-sm text-red-400">{error}</p>
          )}

          {!loading && !error && professionals.length === 0 && (
            <p className="px-6 py-8 text-center text-sm text-slate-500">Sem profissionais registadas.</p>
          )}

          {!loading && !error && professionals.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5 text-left text-xs font-medium text-slate-500">
                    <th className="px-6 py-3">Profissional</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Telefone</th>
                    <th className="px-4 py-3">Registo</th>
                    <th className="px-4 py-3 text-center">Onboarding</th>
                    <th className="px-4 py-3">Estado</th>
                    <th className="px-4 py-3">Número WhatsApp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {professionals.map((p) => (
                    <tr key={p.business_id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-medium text-white">{p.user_name ?? "—"}</p>
                        <p className="text-xs text-slate-500">{p.business_name} · {p.category}</p>
                      </td>
                      <td className="px-4 py-4 text-slate-400">{p.user_email ?? p.email ?? "—"}</td>
                      <td className="px-4 py-4 text-slate-400">{p.phone || "—"}</td>
                      <td className="px-4 py-4 text-slate-400">{formatDate(p.user_created_at)}</td>
                      <td className="px-4 py-4 text-center">
                        {p.onboarding_completed ? (
                          <Check size={15} className="mx-auto text-[#2DD4BF]" />
                        ) : (
                          <X size={15} className="mx-auto text-slate-600" />
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <StatusBadge active={!!p.whatsapp_number} />
                      </td>
                      <td className="px-4 py-4">
                        <WhatsAppEditor businessId={p.business_id} initial={p.whatsapp_number} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
