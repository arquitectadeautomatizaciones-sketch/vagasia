"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import AppLayout from "@/components/AppLayout";
import type { Client, Appointment } from "@/lib/types";
import { Search, Plus, ChevronRight, Phone, Mail, CalendarDays, Loader2, Cake, Camera, Upload } from "lucide-react";
import { parseCsv, type ParsedClient } from "@/lib/csv";

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

function ClientAvatar({
  client,
  size = 32,
  textSize = "text-xs",
}: {
  client: Pick<Client, "name" | "photo_url">;
  size?: number;
  textSize?: string;
}) {
  if (client.photo_url) {
    return (
      <Image
        src={client.photo_url}
        alt={client.name}
        width={size}
        height={size}
        className="rounded-full object-cover shrink-0"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full bg-[#00B4D8]/20 font-semibold text-[#00B4D8] ${textSize}`}
      style={{ width: size, height: size }}
    >
      {client.name.charAt(0)}
    </div>
  );
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

// ── ImportCsvModal ────────────────────────────────────────────────────────────

function ImportCsvModal({
  onClose,
  onImported,
}: {
  onClose: () => void;
  onImported: (count: number) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [parsed, setParsed] = useState<ParsedClient[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [fileName, setFileName] = useState("");
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ imported: number; skipped: number; errors: string[] } | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const { clients, errors } = parseCsv(text);
      setParsed(clients);
      setParseErrors(errors);
      if (clients.length > 0) setStep(2);
      else setParseErrors((prev) => (prev.length ? prev : ["Nenhum cliente válido encontrado."]));
    };
    reader.readAsText(file, "UTF-8");
  }

  async function handleImport() {
    setImporting(true);
    setImportError(null);
    try {
      const res = await fetch("/api/clients/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clients: parsed }),
      });
      const data = await res.json();
      if (!res.ok) { setImportError(data.error ?? "Erro ao importar."); return; }
      setResult(data);
      setStep(3);
      onImported(data.imported);
    } catch {
      setImportError("Erro de ligação. Tenta novamente.");
    } finally {
      setImporting(false);
    }
  }

  const inputClass = "w-full rounded-lg border border-white/10 bg-[#0F172A] px-3.5 py-2.5 text-sm text-white placeholder-slate-600 outline-none focus:border-[#00B4D8]/50 transition-colors";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-2xl border border-white/10 bg-[#1E293B] p-6 space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-white">Importar CSV</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Passo {step} de 3 —{" "}
              {step === 1 ? "Selecionar ficheiro" : step === 2 ? "Pré-visualização" : "Resultado"}
            </p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white text-xl leading-none">×</button>
        </div>

        {/* PASSO 1 — Selecionar ficheiro */}
        {step === 1 && (
          <div className="space-y-4">
            {/* Formato */}
            <div className="rounded-lg bg-[#0F172A] p-4 space-y-2">
              <p className="text-xs font-semibold text-slate-300">Formato esperado</p>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Colunas aceites (separadas por <code className="text-slate-400">,</code> ou{" "}
                <code className="text-slate-400">;</code>):
              </p>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {["nome *", "telefone *", "email", "data_nascimento"].map((col) => (
                  <span
                    key={col}
                    className={`rounded px-2 py-0.5 text-[10px] font-mono ${
                      col.includes("*")
                        ? "bg-[#00B4D8]/15 text-[#00B4D8]"
                        : "bg-white/5 text-slate-400"
                    }`}
                  >
                    {col}
                  </span>
                ))}
              </div>
              <p className="text-[10px] text-slate-600 mt-1">
                * Obrigatório. data_nascimento: formato YYYY-MM-DD
              </p>
            </div>

            {/* Aviso WhatsApp */}
            <div className="flex gap-3 rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-3.5">
              <span className="text-base leading-none">⚠️</span>
              <p className="text-xs text-yellow-200 leading-relaxed">
                Ao importar, cada cliente receberá automaticamente uma mensagem de boas-vindas
                no WhatsApp com o teu número dedicado.
              </p>
            </div>

            {/* Input ficheiro */}
            <div
              className="flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-white/10 bg-[#0F172A] py-8 cursor-pointer hover:border-[#00B4D8]/40 transition-colors"
              onClick={() => fileRef.current?.click()}
            >
              <Upload size={22} className="text-slate-500" />
              <div className="text-center">
                <p className="text-sm text-slate-300">
                  {fileName ? fileName : "Clica para selecionar o ficheiro CSV"}
                </p>
                <p className="text-xs text-slate-600 mt-0.5">Apenas ficheiros .csv</p>
              </div>
              <input
                ref={fileRef}
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={handleFile}
              />
            </div>

            {parseErrors.length > 0 && (
              <div className="space-y-1">
                {parseErrors.map((e, i) => (
                  <p key={i} className="text-xs text-red-400">{e}</p>
                ))}
              </div>
            )}

            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-lg border border-white/10 py-2.5 text-sm text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              Cancelar
            </button>
          </div>
        )}

        {/* PASSO 2 — Pré-visualização */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-300">
                <span className="font-semibold text-white">{parsed.length}</span> clientes encontrados
              </p>
              <p className="text-xs text-slate-500">Mostrando os primeiros 5</p>
            </div>

            <div className="rounded-lg border border-white/5 overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-white/5 text-[10px] uppercase tracking-wider text-slate-500">
                    <th className="px-3 py-2 text-left font-semibold">Nome</th>
                    <th className="px-3 py-2 text-left font-semibold">Telefone</th>
                    <th className="px-3 py-2 text-left font-semibold hidden sm:table-cell">Email</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {parsed.slice(0, 5).map((c, i) => (
                    <tr key={i} className="bg-[#0F172A]">
                      <td className="px-3 py-2 text-slate-200">{c.name}</td>
                      <td className="px-3 py-2 text-slate-400">{c.phone}</td>
                      <td className="px-3 py-2 text-slate-500 hidden sm:table-cell">{c.email ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {parsed.length > 5 && (
                <p className="px-3 py-2 text-[10px] text-slate-600 bg-[#0F172A] border-t border-white/5">
                  + {parsed.length - 5} mais clientes
                </p>
              )}
            </div>

            {parseErrors.length > 0 && (
              <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 space-y-1">
                <p className="text-xs font-semibold text-red-400">{parseErrors.length} linha(s) ignoradas:</p>
                {parseErrors.slice(0, 3).map((e, i) => (
                  <p key={i} className="text-[11px] text-red-300">{e}</p>
                ))}
                {parseErrors.length > 3 && (
                  <p className="text-[11px] text-red-400">+ {parseErrors.length - 3} mais erros</p>
                )}
              </div>
            )}

            {importError && <p className="text-xs text-red-400">{importError}</p>}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => { setStep(1); setParsed([]); setParseErrors([]); setFileName(""); if (fileRef.current) fileRef.current.value = ""; }}
                className="flex-1 rounded-lg border border-white/10 py-2.5 text-sm text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={handleImport}
                disabled={importing}
                className="flex-1 rounded-lg bg-[#00B4D8] py-2.5 text-sm font-medium text-white hover:bg-[#0090b0] disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                {importing ? (
                  <><Loader2 size={14} className="animate-spin" /> A importar…</>
                ) : (
                  `Importar ${parsed.length} clientes`
                )}
              </button>
            </div>
          </div>
        )}

        {/* PASSO 3 — Resultado */}
        {step === 3 && result && (
          <div className="space-y-4">
            <div className="rounded-xl bg-[#0F172A] p-5 space-y-3 text-center">
              <div className="text-3xl font-bold text-white">{result.imported}</div>
              <p className="text-sm text-slate-400">
                {result.imported === 1 ? "cliente importado" : "clientes importados"}
              </p>
              {result.skipped > 0 && (
                <p className="text-xs text-slate-500">
                  {result.skipped} ignorado{result.skipped !== 1 ? "s" : ""} (já existiam)
                </p>
              )}
            </div>

            {result.errors.length > 0 && (
              <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 space-y-1">
                <p className="text-xs font-semibold text-red-400">{result.errors.length} erro(s):</p>
                {result.errors.slice(0, 4).map((e, i) => (
                  <p key={i} className="text-[11px] text-red-300">{e}</p>
                ))}
                {result.errors.length > 4 && (
                  <p className="text-[11px] text-red-400">+ {result.errors.length - 4} mais</p>
                )}
              </div>
            )}

            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-lg bg-[#00B4D8] py-2.5 text-sm font-medium text-white hover:bg-[#0090b0] transition-colors"
            >
              Fechar
            </button>
          </div>
        )}

      </div>
    </div>
  );
}

function ClientDrawer({
  client,
  onClose,
  onPhotoUpdate,
}: {
  client: Client;
  onClose: () => void;
  onPhotoUpdate: (clientId: string, photoUrl: string) => void;
}) {
  const [history, setHistory] = useState<Appointment[]>([]);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const birthday = isBirthdayToday(client.data_nascimento);

  useEffect(() => {
    fetch(`/api/appointments?client_id=${client.id}`)
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setHistory(data); })
      .catch(() => {});
  }, [client.id]);

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoUploading(true);
    setPhotoError(null);
    try {
      const formData = new FormData();
      formData.append("photo", file);
      const res = await fetch(`/api/clients/${client.id}/photo`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        setPhotoError(data.error ?? "Erro ao guardar a foto.");
        return;
      }
      onPhotoUpdate(client.id, data.photo_url);
    } catch {
      setPhotoError("Erro de ligação. Tenta novamente.");
    } finally {
      setPhotoUploading(false);
      // Reset so the same file can be re-selected
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex">
      <div className="flex-1 bg-black/40" onClick={onClose} />
      <div className="w-80 bg-[#1E293B] border-l border-white/5 flex flex-col h-full overflow-y-auto">
        {/* Drawer header */}
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
          {/* Photo upload */}
          <div className="flex flex-col items-center gap-2">
            <div className="relative group">
              <ClientAvatar client={client} size={72} textSize="text-xl" />
              {photoUploading && (
                <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/60">
                  <Loader2 size={20} className="animate-spin text-white" />
                </div>
              )}
              {!photoUploading && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 flex items-center justify-center rounded-full bg-black/0 group-hover:bg-black/50 transition-colors opacity-0 group-hover:opacity-100"
                  title="Alterar foto"
                >
                  <Camera size={18} className="text-white" />
                </button>
              )}
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={photoUploading}
              className="text-xs text-[#00B4D8] hover:underline disabled:opacity-40 transition-opacity"
            >
              {client.photo_url ? "Alterar foto" : "Adicionar foto"}
            </button>
            {photoError && <p className="text-[11px] text-red-400 text-center">{photoError}</p>}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handlePhotoChange}
            />
          </div>

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
  const [showImportModal, setShowImportModal] = useState(false);

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

  function handleImported(count: number) {
    if (count > 0) {
      fetch("/api/clients")
        .then((r) => r.json())
        .then((data) => { if (Array.isArray(data)) setClients(data); })
        .catch(() => {});
    }
  }

  function handlePhotoUpdate(clientId: string, photoUrl: string) {
    setClients((prev) =>
      prev.map((c) => (c.id === clientId ? { ...c, photo_url: photoUrl } : c))
    );
    setSelected((prev) =>
      prev && prev.id === clientId ? { ...prev, photo_url: photoUrl } : prev
    );
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
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowImportModal(true)}
              className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
            >
              <Upload size={15} />
              Importar CSV
            </button>
            <button
              onClick={() => setShowNewModal(true)}
              className="flex items-center gap-2 rounded-lg bg-[#00B4D8] px-4 py-2 text-sm font-medium text-white hover:bg-[#0090b0] transition-colors"
            >
              <Plus size={15} />
              Novo cliente
            </button>
          </div>
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
                          <ClientAvatar client={client} size={32} />
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
        <ClientDrawer
          client={selected}
          onClose={() => setSelected(null)}
          onPhotoUpdate={handlePhotoUpdate}
        />
      )}

      {showNewModal && (
        <NewClientModal onClose={() => setShowNewModal(false)} onCreated={handleClientCreated} />
      )}

      {showImportModal && (
        <ImportCsvModal
          onClose={() => setShowImportModal(false)}
          onImported={(count) => { handleImported(count); setShowImportModal(false); }}
        />
      )}
    </AppLayout>
  );
}
