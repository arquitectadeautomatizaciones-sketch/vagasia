// ── CSV helpers — funciones puras compartidas ────────────────────────────────
// Usadas en: src/app/clientes/page.tsx  y  src/app/onboarding/page.tsx

export interface ParsedClient {
  name: string;
  phone: string;
  email?: string;
  data_nascimento?: string;
}

export function detectSeparator(firstLine: string): "," | ";" {
  return (firstLine.match(/;/g) ?? []).length >= (firstLine.match(/,/g) ?? []).length
    ? ";"
    : ",";
}

export function parseCsv(text: string): { clients: ParsedClient[]; errors: string[] } {
  const lines = text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .filter(Boolean);

  if (lines.length < 2) {
    return { clients: [], errors: ["Ficheiro vazio ou sem dados."] };
  }

  const sep = detectSeparator(lines[0]);
  const headers = lines[0]
    .split(sep)
    .map((h) => h.trim().toLowerCase().replace(/['"]/g, ""));

  const nameIdx  = headers.findIndex((h) => h === "nome"     || h === "name");
  const phoneIdx = headers.findIndex((h) => h === "telefone" || h === "phone");
  const emailIdx = headers.findIndex((h) => h === "email");
  const birthIdx = headers.findIndex((h) => h === "data_nascimento" || h === "birthday");

  if (nameIdx === -1 || phoneIdx === -1) {
    return {
      clients: [],
      errors: ["Colunas obrigatórias não encontradas: nome, telefone."],
    };
  }

  const clients: ParsedClient[] = [];
  const errors: string[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i]
      .split(sep)
      .map((c) => c.trim().replace(/^["']|["']$/g, ""));
    const name  = cols[nameIdx]  ?? "";
    const phone = cols[phoneIdx] ?? "";

    if (!name || !phone) {
      errors.push(`Linha ${i + 1}: nome ou telefone em falta.`);
      continue;
    }

    const client: ParsedClient = { name, phone };
    if (emailIdx !== -1 && cols[emailIdx]) client.email = cols[emailIdx];
    if (birthIdx !== -1 && cols[birthIdx]) client.data_nascimento = cols[birthIdx];
    clients.push(client);
  }

  return { clients, errors };
}
