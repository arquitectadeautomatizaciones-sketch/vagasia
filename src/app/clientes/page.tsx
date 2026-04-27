"use client";

import { useState } from "react";
import AppLayout from "@/components/AppLayout";
import { mockClients, mockAppointments } from "@/lib/mock-data";
import type { Client } from "@/lib/types";
import { Search, Plus, ChevronRight, Phone, Mail, CalendarDays } from "lucide-react";

function ClientDrawer({ client, onClose }: { client: Client; onClose: () => void }) {
  const history = mockAppointments.filter((a) => a.client_id === client.id);

  return (
    <div className="fixed inset-0 z-40 flex">
      <div className="flex-1 bg-black/40" onClick={onClose} />
      <div className="w-80 bg-[#1E293B] border-l border-white/5 flex flex-col h-full overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
          <h3 className="text-sm font-semibold text-white">{client.name}</h3>
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
                {history.map((a) => (
                  <div key={a.id} className="rounded-lg bg-[#0F172A] px-3 py-2.5">
                    <div className="flex justify-between items-start">
                      <p className="text-xs font-medium text-white">{a.service?.name}</p>
                      <p className="text-xs text-[#2DD4BF]">€{a.price}</p>
                    </div>
                    <p className="text-[10px] text-slate-600 mt-0.5">
                      {new Date(a.starts_at).toLocaleDateString("pt-PT")}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ClientesPage() {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Client | null>(null);

  const filtered = mockClients.filter(
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
            <p className="text-sm text-slate-400 mt-0.5">{mockClients.length} clientes registados</p>
          </div>
          <button className="flex items-center gap-2 rounded-lg bg-[#00B4D8] px-4 py-2 text-sm font-medium text-white hover:bg-[#0090b0] transition-colors">
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
              {filtered.map((client) => (
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
                        <p className="font-medium text-white">{client.name}</p>
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
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="py-12 text-center text-sm text-slate-500">
              Nenhum cliente encontrado.
            </div>
          )}
        </div>
      </div>

      {selected && (
        <ClientDrawer client={selected} onClose={() => setSelected(null)} />
      )}
    </AppLayout>
  );
}
