import { createSupabaseServerClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

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

export const unauthorizedJson = () =>
  NextResponse.json({ error: "Não autenticado." }, { status: 401 });
