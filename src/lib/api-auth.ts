import { createSupabaseServerClient } from "@/utils/supabase/server";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import type { ProfessionalRole } from "@/lib/types";

function serviceRoleClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

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

/**
 * Devolve o utilizador autenticado completo (inclui app_metadata).
 * Devolve null se não autenticado.
 */
export async function getAuthUser() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

/**
 * Devolve o professional_id do utilizador autenticado lido do app_metadata.
 * Devolve null se não autenticado ou se ainda não tem professional_id (usuarios pre-migración).
 */
export async function getAuthProfessionalId(): Promise<string | null> {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  return (user.app_metadata?.professional_id as string) ?? null;
}

/**
 * Devolve o role do utilizador autenticado ('owner' | 'collaborator').
 * Owners têm acesso total; collaborators só veem os seus próprios dados.
 * Devolve 'owner' como fallback para utilizadores sem role definido (compatibilidade).
 */
export async function getAuthRole(): Promise<ProfessionalRole> {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return "owner";
  return (user.app_metadata?.role as ProfessionalRole) ?? "owner";
}

/**
 * Devolve { businessId, professionalId, role } num único call.
 * Uso conveniente nos route handlers que precisam dos três valores.
 */
export async function getAuthContext(): Promise<{
  businessId: string | null;
  professionalId: string | null;
  role: ProfessionalRole;
}> {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { businessId: null, professionalId: null, role: "owner" };
  return {
    businessId:     (user.app_metadata?.business_id     as string) ?? null,
    professionalId: (user.app_metadata?.professional_id as string) ?? null,
    role:           (user.app_metadata?.role            as ProfessionalRole) ?? "owner",
  };
}

/**
 * Devolve true se o utilizador autenticado é administrador.
 * Usa o service role para ler app_metadata fresco da BD, ignorando o JWT.
 */
export async function isAdminUser(): Promise<boolean> {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const { data: { user: fresh } } = await serviceRoleClient().auth.admin.getUserById(user.id);
  return !!fresh?.app_metadata?.is_admin;
}

export const unauthorizedJson = () =>
  NextResponse.json({ error: "Não autenticado." }, { status: 401 });

export const forbiddenJson = () =>
  NextResponse.json({ error: "Não autorizado." }, { status: 403 });
