"use client";

import { useState, useEffect } from "react";
import AppLayout from "@/components/AppLayout";
import type { Client, Appointment } from "@/lib/types";
import { Search, Plus, ChevronRight, Phone, Mail, CalendarDays, Loader2, Cake } from "lucide-react";

function isBirthdayToday(dataNascimento: string | null | undefined): boolean {
  if (!dataNascimento) return false;
  const today = new Date();
  const [, month, day] = dataNascimento.split("-").map(Number);
  return month - 1 === today.getMonth() && day === today.getDate();
}

function formatBirthday(dataNascimento: string): string {
  const [, month, day] = dataNascimento.split("-").map(Number);
  return new Date(2000, month - 1, day).toLocaleDateString("pt-PT", { day: "numeric", month: "long" });
}

function NewClientModal({ onClose, onCreated }: { onClose: () => void; onCreated: (c: Client) => void }) {
  const [form, setForm] = useState({ name: "", phone: "", email: "", notes: "", data_nascimento: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Erro ao criar cliente."); return; }
      onCreated(data);
    } catch {
      setError("Erro de ligação.");
    } finally {
      setSaving(false);
    }
  }

  const inputClass = "w-full rounded-lg border border-white/10 bg-[#0F172A] px-3.5 py-2.5 text-sm text-white placeholder-slate-600 outline-none focus:border-[#00B4D8]/50 transition-colors";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-[#1E293B] p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-white">Novo Cliente</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-white text-xl leading-none">×</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs text-slate-400">Nome *</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="Nome da cliente" className={inputClass} />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-slate-400">Telefone *</label>
            <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required placeholder="+351 9xx xxx xxx" className={inputClass} />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-slate-400">Email</label>
            <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} type="email" placeholder="email@exemplo.com" className={inputClass} />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-slate-400">Data de Nascimento</label>
            <input
              value={form.data_nascimento}
              onChange={(e) => setForm({ ...form, data_nascimento: e.target.value })}
              type="date"
              className={inputClass}
              style={{ colorScheme: "dark" }}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-slate-400">Notas</label>
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} placeholder="Alergias, preferências…" className={`${inputClass} resize-none`} />
          </div>
          {error && <p className="text-xs text-red-400">{error}</p>}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 rounded-lg border border-white/10 py-2.5 text-sm text-slate-400 hover:text-white hover:bg-white/5 transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={saving} className="flex-1 rounded-lg bg-[#00B4D8] py-2.5 text-sm font-medium text-white hover:bg-[#0090b0] disabled:opacity-50 transition-colors">
              {saving ? "A guardar…" : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ClientDrawer({ client, onClose }: { client: Client; onClose: () => void }) {
  const [history, setHistory] = useState<Appointment[]>([]);

  useEffect(() => {
    fetch(`/api/appointments?client_id=${client.id}`)
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setHistory(data); })
      .catch(() => {});
  }, [client.id]);

  const birthday = isBirthdayToday(client.data_nascimento);

  return (
    <div className="fixed inset-0 z-40 flex">
      <div className="flex-1 bg-black/40" onClick={onClose} />
      <div className="w-80 bg-[#1E293B] border-l border-white/5 flex flex-col h-full overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-white">{client.name}</h3>
            {birthday && (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#2DD4BF]/15 px-2 py-0.5 text-[10px] font-semibold text-[#2DD4BF]">
                <Cake size={10} /> Aniversário!
              </span>
            )}
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white text-lg leading-none">×</button>
        </div>
        <div className="p-5 space-y-5">
          {/* Contact */}
          <div className="space-y-2">
            <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Contacto</p>
            <div className="flex items-center gap-2 text-sm text-slate-300">
              <Phone size={13} className="text-slate-500" />
              {client.phone}
            </div>
            {client.email && (
              <div className="flex items-center gap-2 text-sm text-slate-300">
                <Mail size={13} className="text-slate-500" />
                {client.email}
              </div>
            )}
          </div>

          {/* Birthday */}
          {client.data_nascimento && (
            <div className="space-y-2">
              <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Aniversário</p>
              <div className="flex items-center gap-2 text-sm text-slate-300">
                <Cake size={13} className="text-slate-500" />
                {formatBirthday(client.data_nascimento)}
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-[#0F172A] p-3">
              <p className="text-lg font-bold text-white">{client.total_appointments}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">Marcações</p>
            </div>
            <div className="rounded-lg bg-[#0F172A] p-3">
              <p className="text-lg font-bold text-[#2DD4BF]">€{client.total_spent}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">Total gasto</p>
            </div>
          </div>

          {/* Notes */}
          {client.notes && (
            <div>
              <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-1.5">Notas</p>
              <p className="text-xs text-slate-400 bg-[#0F172A] rounded-lg p-3">{client.notes}</p>
            </div>
          )}

          {/* History */}
          <div>
            <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-2">Histórico</p>
            {history.length === 0 ? (
              <p className="text-xs text-slate-600">Sem marcações registadas.</p>
            ) : (
              <div className="space-y-2">
                {history.map((a) => {
                  const service = a.service as unknown as { name: string } | undefined;
                  return (
                    <div key={a.id} className="rounded-lg bg-[#0F172A] px-3 py-2.5">
                      <div className="flex justify-between items-start">
                        <p className="text-xs font-medium text-white">{service?.name ?? "—"}</p>
                        <p className="text-xs text-[#2DD4BF]">€{a.price}</p>
                      </div>
                      <p className="text-[10px] text-slate-600 mt-0.5">
                        {new Date(a.starts_at).toLocaleDateString("pt-PT")}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ClientesPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Client | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);

  useEffect(() => {
    fetch("/api/clients")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setClients(data);
        else setError(data.error ?? "Erro ao carregar clientes.");
      })
      .catch(() => setError("Erro ao carregar clientes."))
      .finally(() => setLoading(false));
  }, []);

  function handleClientCreated(client: Client) {
    setClients((prev) => [...prev, client].sort((a, b) => a.name.localeCompare(b.name)));
    setShowNewModal(false);
  }

  const filtered = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search)
  );

  return (
    <AppLayout>
      <div className="p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-white">Clientes</h1>
            <p className="text-sm text-slate-400 mt-0.5">
              {loading ? "A carregar…" : `${clients.length} clientes registados`}
            </p>
          </div>
          <button
            onClick={() => setShowNewModal(true)}
            className="flex items-center gap-2 rounded-lg bg-[#00B4D8] px-4 py-2 text-sm font-medium text-white hover:bg-[#0090b0] transition-colors"
          >
            <Plus size={15} />
            Novo cliente
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Pesquisar por nome ou telefone…"
            className="w-full rounded-lg border border-white/10 bg-[#1E293B] py-2.5 pl-9 pr-4 text-sm text-white placeholder-slate-600 outline-none focus:border-[#00B4D8]/50 transition-colors"
          />
        </div>

        {/* Table */}
        <div className="rounded-xl border border-white/5 bg-[#1E293B] overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={24} className="animate-spin text-slate-600" />
            </div>
          ) : error ? (
            <div className="py-16 text-center text-sm text-red-400">{error}</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5 text-[11px] uppercase tracking-wider text-slate-500">
                  <th className="px-5 py-3 text-left font-semibold">Cliente</th>
                  <th className="px-5 py-3 text-left font-semibold hidden md:table-cell">Telefone</th>
                  <th className="px-5 py-3 text-right font-semibold hidden sm:table-cell">Marcações</th>
                  <th className="px-5 py-3 text-right font-semibold hidden sm:table-cell">Total gasto</th>
                  <th className="px-5 py-3 text-right font-semibold hidden lg:table-cell">Última visita</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map((client) => {
                  const birthday = isBirthdayToday(client.data_nascimento);
                  return (
                    <tr
                      key={client.id}
                      onClick={() => setSelected(client)}
                      className="hover:bg-white/2 cursor-pointer transition-colors"
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#00B4D8]/20 text-xs font-semibold text-[#00B4D8]">
                            {client.name.charAt(0)}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <p className="font-medium text-white">{client.name}</p>
                              {birthday && <Cake size={12} className="text-[#2DD4BF]" />}
                            </div>
                            {client.notes && (
                              <p className="text-[10px] text-slate-600 truncate max-w-[150px]">{client.notes}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-slate-400 hidden md:table-cell">
                        <div className="flex items-center gap-1.5">
                          <Phone size={12} />
                          {client.phone}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-right text-slate-300 hidden sm:table-cell">
                        <div className="flex items-center justify-end gap-1.5">
                          <CalendarDays size={12} className="text-slate-600" />
                          {client.total_appointments}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-right font-semibold text-[#2DD4BF] hidden sm:table-cell">
                        €{client.total_spent}
                      </td>
                      <td className="px-5 py-3.5 text-right text-slate-500 text-xs hidden lg:table-cell">
                        {client.last_appointment
                          ? new Date(client.last_appointment).toLocaleDateString("pt-PT")
                          : "—"}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <ChevronRight size={15} className="text-slate-600 ml-auto" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
          {!loading && !error && filtered.length === 0 && (
            <div className="py-12 text-center text-sm text-slate-500">
              Nenhum cliente encontrado.
            </div>
          )}
        </div>
      </div>

      {selected && (
        <ClientDrawer client={selected} onClose={() => setSelected(null)} />
      )}

      {showNewModal && (
        <NewClientModal onClose={() => setShowNewModal(false)} onCreated={handleClientCreated} />
      )}
    </AppLayout>
  );
}
