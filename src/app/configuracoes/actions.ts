import type { AvailabilityException } from "@/lib/types";

export const DEMO_BUSINESS_ID = "00000000-0000-0000-0000-000000000001";

async function apiFetch(path: string, init?: RequestInit) {
  const res = await fetch(path, init);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Erro ${res.status}`);
  }
  return res;
}

export async function fetchExceptions(): Promise<AvailabilityException[]> {
  const res = await apiFetch("/api/exceptions");
  return res.json();
}

export async function createException(
  payload: Omit<AvailabilityException, "id">
): Promise<AvailabilityException> {
  const res = await apiFetch("/api/exceptions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function deleteException(id: string): Promise<void> {
  await apiFetch(`/api/exceptions/${id}`, { method: "DELETE" });
}
