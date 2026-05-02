import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseAdminClient } from "@/utils/supabase/admin";
import { isAdminUser, forbiddenJson } from "@/lib/api-auth";

function adminDb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

export async function GET() {
  if (!(await isAdminUser())) return forbiddenJson();

  const db = adminDb();
  const auth = createSupabaseAdminClient();

  // All real businesses (exclude the demo seed row)
  const { data: businesses, error: bizError } = await db
    .from("businesses")
    .select("id, name, category, phone, email, whatsapp_number, whatsapp_phone_number_id, created_at, auth_user_id")
    .not("auth_user_id", "is", null)
    .neq("id", "00000000-0000-0000-0000-000000000001")
    .order("created_at", { ascending: false });

  if (bizError) return NextResponse.json({ error: bizError.message }, { status: 500 });

  // All auth users (up to 1000 — sufficient for current scale)
  const { data: { users }, error: authError } = await auth.auth.admin.listUsers({ perPage: 1000 });
  if (authError) return NextResponse.json({ error: authError.message }, { status: 500 });

  const userMap = new Map(users.map((u) => [u.id, u]));

  const professionals = (businesses ?? []).map((b) => {
    const u = b.auth_user_id ? userMap.get(b.auth_user_id) : undefined;
    return {
      business_id: b.id,
      business_name: b.name,
      category: b.category,
      phone: b.phone,
      email: b.email,
      whatsapp_number: b.whatsapp_number ?? null,
      whatsapp_phone_number_id: b.whatsapp_phone_number_id ?? null,
      created_at: b.created_at,
      user_name: (u?.user_metadata?.name as string) ?? null,
      user_email: u?.email ?? null,
      user_created_at: u?.created_at ?? null,
      onboarding_completed: !!u?.app_metadata?.onboarding_completed,
    };
  });

  return NextResponse.json(professionals);
}
