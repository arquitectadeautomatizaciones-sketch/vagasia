import type { Transaction, TransactionType } from "@/lib/types";

async function apiFetch(path: string, init?: RequestInit) {
  const res = await fetch(path, init);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Erro ${res.status}`);
  }
  return res;
}

export async function fetchTransactions(): Promise<Transaction[]> {
  const res = await apiFetch("/api/transactions");
  return res.json();
}

export async function createTransaction(payload: {
  type: TransactionType;
  amount: number;
  description: string;
}): Promise<Transaction> {
  const res = await apiFetch("/api/transactions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return res.json();
}
