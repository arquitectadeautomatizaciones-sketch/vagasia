import { createSupabaseAdminClient } from "@/utils/supabase/admin";
import { NextResponse } from "next/server";
import { getAuthBusinessId, unauthorizedJson } from "@/lib/api-auth";

interface ClientRow {
  name: string;
  phone: string;
  email?: string;
  data_nascimento?: string;
}

const BATCH_SIZE = 50;
const MAX_ROWS = 500;

export async function POST(request: Request) {
  const businessId = await getAuthBusinessId();
  if (!businessId) return unauthorizedJson();

  let body: { clients?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  if (!Array.isArray(body.clients) || body.clients.length === 0) {
    return NextResponse.json({ error: "Array de clientes vazio ou inválido." }, { status: 400 });
  }

  if (body.clients.length > MAX_ROWS) {
    return NextResponse.json(
      { error: `Máximo ${MAX_ROWS} clientes por importação.` },
      { status: 400 }
    );
  }

  // Validate rows
  const valid: ClientRow[] = [];
  const errors: string[] = [];

  for (let i = 0; i < body.clients.length; i++) {
    const row = body.clients[i] as Record<string, unknown>;
    const name = typeof row.name === "string" ? row.name.trim() : "";
    const phone = typeof row.phone === "string" ? row.phone.trim() : "";

    if (!name || !phone) {
      errors.push(`Linha ${i + 2}: nome e telefone são obrigatórios.`);
      continue;
    }

    valid.push({
      name,
      phone,
      email: typeof row.email === "string" && row.email.trim() ? row.email.trim() : undefined,
      data_nascimento:
        typeof row.data_nascimento === "string" && row.data_nascimento.trim()
          ? row.data_nascimento.trim()
          : undefined,
    });
  }

  const supabase = createSupabaseAdminClient();

  // Fetch all existing phones for this business to deduplicate
  const { data: existing, error: fetchError } = await supabase
    .from("clients")
    .select("phone")
    .eq("business_id", businessId);

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  const existingPhones = new Set((existing ?? []).map((r) => r.phone));

  const toInsert = valid.filter((c) => !existingPhones.has(c.phone));
  const skipped = valid.length - toInsert.length;

  // Insert in batches of BATCH_SIZE
  let imported = 0;
  for (let i = 0; i < toInsert.length; i += BATCH_SIZE) {
    const batch = toInsert.slice(i, i + BATCH_SIZE).map((c) => ({
      business_id: businessId,
      name: c.name,
      phone: c.phone,
      email: c.email ?? null,
      data_nascimento: c.data_nascimento ?? null,
      total_appointments: 0,
      total_spent: 0,
    }));

    const { error: insertError } = await supabase.from("clients").insert(batch);

    if (insertError) {
      errors.push(`Erro ao inserir lote ${Math.floor(i / BATCH_SIZE) + 1}: ${insertError.message}`);
    } else {
      imported += batch.length;
    }
  }

  return NextResponse.json({ imported, skipped, errors });
}

/*
 * SQL para adicionar o índice único (business_id, phone) na tabela clients.
 * Executar manualmente no Supabase SQL Editor quando conveniente.
 * Este índice previne duplicados também via INSERT manual e via bot n8n.
 *
 * -- Primeiro verifica se já existe algum duplicado que quebraria o índice:
 * SELECT phone, business_id, COUNT(*)
 *   FROM clients
 *   GROUP BY phone, business_id
 *   HAVING COUNT(*) > 1;
 *
 * -- Se não houver duplicados, adicionar o índice único:
 * ALTER TABLE clients
 *   ADD CONSTRAINT clients_business_id_phone_unique
 *   UNIQUE (business_id, phone);
 */
