import { createSupabaseServerClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export const ADMIN_EMAIL = "diana@arquitectadeautomatizaciones.com";

/**
 * Devolve o business_id do utilizador autenticado lido do app_metadata (sem query extra à BD).
 * Devolve null se não autenticado.
 */
export async function getAuthBusinessId(): Promise<string | null> {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  return (user.app_metadata?.business_id as string) ?? null;
}

/** Devolve true se o utilizador autenticado é administrador. */
export async function isAdminUser(): Promise<boolean> {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  return user.email === ADMIN_EMAIL || !!user.app_metadata?.is_admin;
}

export const unauthorizedJson = () =>
  NextResponse.json({ error: "Não autenticado." }, { status: 401 });

export const forbiddenJson = () =>
  NextResponse.json({ error: "Não autorizado." }, { status: 403 });
