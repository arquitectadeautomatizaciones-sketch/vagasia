import { createSupabaseAdminClient } from "@/utils/supabase/admin";
import { getAuthBusinessId, unauthorizedJson } from "@/lib/api-auth";

// ── CRC-32 (PKZIP required) ───────────────────────────────────────────────────

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[i] = c;
  }
  return t;
})();

function crc32(buf: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

// ── ZIP builder (STORE — no compression, no external deps) ───────────────────

interface ZipEntry {
  name: string;   // filename inside the ZIP
  data: Uint8Array;
}

function buildZip(entries: ZipEntry[]): Uint8Array {
  const parts: Uint8Array[] = [];
  const centralDir: Uint8Array[] = [];
  let offset = 0;

  for (const entry of entries) {
    const nameBytes  = new TextEncoder().encode(entry.name);
    const crc        = crc32(entry.data);
    const size       = entry.data.length;

    // Local file header (30 bytes + filename)
    const local = new Uint8Array(30 + nameBytes.length);
    const lv = new DataView(local.buffer);
    lv.setUint32(0,  0x04034b50, true); // signature PK\x03\x04
    lv.setUint16(4,  20,         true); // version needed: 2.0
    lv.setUint16(6,  0,          true); // flags
    lv.setUint16(8,  0,          true); // compression: STORE
    lv.setUint16(10, 0,          true); // mod time
    lv.setUint16(12, 0,          true); // mod date
    lv.setUint32(14, crc,        true); // crc-32
    lv.setUint32(18, size,       true); // compressed size
    lv.setUint32(22, size,       true); // uncompressed size
    lv.setUint16(26, nameBytes.length, true); // filename length
    lv.setUint16(28, 0,          true); // extra field length
    local.set(nameBytes, 30);

    parts.push(local);
    parts.push(entry.data);

    // Central directory entry (46 bytes + filename)
    const cd = new Uint8Array(46 + nameBytes.length);
    const cv = new DataView(cd.buffer);
    cv.setUint32(0,  0x02014b50, true); // signature PK\x01\x02
    cv.setUint16(4,  20,         true); // version made by
    cv.setUint16(6,  20,         true); // version needed
    cv.setUint16(8,  0,          true); // flags
    cv.setUint16(10, 0,          true); // compression: STORE
    cv.setUint16(12, 0,          true); // mod time
    cv.setUint16(14, 0,          true); // mod date
    cv.setUint32(16, crc,        true); // crc-32
    cv.setUint32(20, size,       true); // compressed size
    cv.setUint32(24, size,       true); // uncompressed size
    cv.setUint16(28, nameBytes.length, true); // filename length
    cv.setUint16(30, 0,          true); // extra field length
    cv.setUint16(32, 0,          true); // file comment length
    cv.setUint16(34, 0,          true); // disk number start
    cv.setUint16(36, 0,          true); // internal attrs
    cv.setUint32(38, 0,          true); // external attrs
    cv.setUint32(42, offset,     true); // local header offset
    cd.set(nameBytes, 46);

    centralDir.push(cd);
    offset += local.length + entry.data.length;
  }

  const cdBytes    = concat(centralDir);
  const cdSize     = cdBytes.length;
  const cdOffset   = offset;
  const count      = entries.length;

  // End of central directory (22 bytes)
  const eocd = new Uint8Array(22);
  const ev   = new DataView(eocd.buffer);
  ev.setUint32(0,  0x06054b50, true); // signature PK\x05\x06
  ev.setUint16(4,  0,          true); // disk number
  ev.setUint16(6,  0,          true); // start disk
  ev.setUint16(8,  count,      true); // entries on disk
  ev.setUint16(10, count,      true); // total entries
  ev.setUint32(12, cdSize,     true); // central dir size
  ev.setUint32(16, cdOffset,   true); // central dir offset
  ev.setUint16(20, 0,          true); // comment length

  return concat([...parts, cdBytes, eocd]);
}

function concat(arrays: Uint8Array[]): Uint8Array {
  const total = arrays.reduce((s, a) => s + a.length, 0);
  const out   = new Uint8Array(total);
  let pos = 0;
  for (const a of arrays) { out.set(a, pos); pos += a.length; }
  return out;
}

// ── CSV serialiser ────────────────────────────────────────────────────────────

function toCsv(headers: string[], rows: Record<string, unknown>[], keys: string[]): Uint8Array {
  const escape = (v: unknown): string => {
    if (v === null || v === undefined) return "";
    const s = String(v);
    // Wrap in quotes if contains comma, quote, or newline
    return s.includes(",") || s.includes('"') || s.includes("\n")
      ? `"${s.replace(/"/g, '""')}"`
      : s;
  };
  const lines = [
    headers.map(escape).join(","),
    ...rows.map((r) => keys.map((k) => escape(r[k])).join(",")),
  ];
  return new TextEncoder().encode(lines.join("\r\n") + "\r\n");
}

// ── Day-of-week mapping ───────────────────────────────────────────────────────

const DAYS_PT = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];

// ── GET handler ───────────────────────────────────────────────────────────────

export async function GET() {
  const businessId = await getAuthBusinessId();
  if (!businessId) return unauthorizedJson();

  const sb = createSupabaseAdminClient();

  // Fetch business name for filename
  const { data: biz } = await sb
    .from("businesses")
    .select("name")
    .eq("id", businessId)
    .single();
  const bizName = (biz?.name ?? "negocio")
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
  const today = new Date().toISOString().slice(0, 10);

  // Fetch all 7 tables in parallel
  const [
    { data: clients },
    { data: appointments },
    { data: services },
    { data: hours },
    { data: loyaltyCards },
    { data: waitingList },
    { data: transactions },
  ] = await Promise.all([
    sb.from("clients").select("*").eq("business_id", businessId).order("name"),
    sb.from("appointments").select("*").eq("business_id", businessId).order("starts_at", { ascending: false }),
    sb.from("services").select("*").eq("business_id", businessId).order("name"),
    sb.from("business_hours").select("*").eq("business_id", businessId).order("day_of_week"),
    sb.from("loyalty_cards").select("*").eq("business_id", businessId).order("created_at", { ascending: false }),
    sb.from("waiting_list").select("*").eq("business_id", businessId).order("created_at", { ascending: false }),
    sb.from("transactions").select("*").eq("business_id", businessId).order("created_at", { ascending: false }),
  ]);

  // ── 1. clientes.csv ──────────────────────────────────────────────────────────
  const clientsCsv = toCsv(
    ["ID", "Nome", "Telefone", "Email", "Data de Nascimento", "Notas", "Total de Marcações", "Total Gasto (€)", "Última Marcação", "Criado em"],
    clients ?? [],
    ["id", "name", "phone", "email", "data_nascimento", "notes", "total_appointments", "total_spent", "last_appointment", "created_at"],
  );

  // ── 2. marcacoes.csv ─────────────────────────────────────────────────────────
  const apptCsv = toCsv(
    ["ID", "ID Cliente", "ID Serviço", "ID Profissional", "Data e Hora Início", "Data e Hora Fim", "Estado", "Preço (€)", "Notas", "Criado em"],
    appointments ?? [],
    ["id", "client_id", "service_id", "professional_id", "starts_at", "ends_at", "status", "price", "notes", "created_at"],
  );

  // ── 3. servicos.csv ──────────────────────────────────────────────────────────
  const servicesCsv = toCsv(
    ["ID", "Nome", "Duração (min)", "Preço (€)", "Descrição", "Ativo"],
    services ?? [],
    ["id", "name", "duration_minutes", "price", "description", "active"],
  );

  // ── 4. horarios.csv — map day_of_week number to name ────────────────────────
  const hoursRows = (hours ?? []).map((h) => ({
    ...h,
    dia_semana_nome: DAYS_PT[h.day_of_week as number] ?? h.day_of_week,
    fechado: (h.is_closed as boolean) ? "Sim" : "Não",
  }));
  const hoursCsv = toCsv(
    ["ID", "Dia da Semana (nº)", "Dia da Semana", "Hora de Abertura", "Hora de Fecho", "Fechado"],
    hoursRows,
    ["id", "day_of_week", "dia_semana_nome", "open_time", "close_time", "fechado"],
  );

  // ── 5. fidelizacao.csv ───────────────────────────────────────────────────────
  const loyaltyCsv = toCsv(
    ["ID", "ID Cliente", "Total de Carimbos", "Meta", "Recompensa", "Criado em"],
    loyaltyCards ?? [],
    ["id", "client_id", "total_stamps", "goal", "reward", "created_at"],
  );

  // ── 6. lista_espera.csv ──────────────────────────────────────────────────────
  const waitCsv = toCsv(
    ["ID", "ID Cliente", "ID Serviço", "Data Preferida", "Hora Preferida (início)", "Hora Preferida (fim)", "Notas", "Notificado", "Criado em"],
    (waitingList ?? []).map((w) => ({
      ...w,
      notificado: (w.notified as boolean) ? "Sim" : "Não",
    })),
    ["id", "client_id", "service_id", "preferred_date", "preferred_time_start", "preferred_time_end", "notes", "notificado", "created_at"],
  );

  // ── 7. financeiro.csv ────────────────────────────────────────────────────────
  const txCsv = toCsv(
    ["ID", "Tipo", "Valor (€)", "Descrição", "Data"],
    transactions ?? [],
    ["id", "type", "amount", "description", "created_at"],
  );

  // ── Build ZIP ────────────────────────────────────────────────────────────────
  const zip = buildZip([
    { name: "clientes.csv",     data: clientsCsv  },
    { name: "marcacoes.csv",    data: apptCsv      },
    { name: "servicos.csv",     data: servicesCsv  },
    { name: "horarios.csv",     data: hoursCsv     },
    { name: "fidelizacao.csv",  data: loyaltyCsv   },
    { name: "lista_espera.csv", data: waitCsv      },
    { name: "financeiro.csv",   data: txCsv        },
  ]);

  return new Response(zip.buffer as ArrayBuffer, {
    status: 200,
    headers: {
      "Content-Type":        "application/zip",
      "Content-Disposition": `attachment; filename="vagasia-dados-${bizName}-${today}.zip"`,
      "Content-Length":      String(zip.length),
    },
  });
}
