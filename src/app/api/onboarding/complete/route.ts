import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import { createSupabaseAdminClient } from "@/utils/supabase/admin";
import { unauthorizedJson } from "@/lib/api-auth";

function adminDb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

export async function POST() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return unauthorizedJson();

  const businessId = user.app_metadata?.business_id as string | undefined;
  if (!businessId) return unauthorizedJson();

  // Read latest business name to sync into app_metadata
  const { data: business } = await adminDb()
    .from("businesses")
    .select("name")
    .eq("id", businessId)
    .single();

  const admin = createSupabaseAdminClient();
  const { error } = await admin.auth.admin.updateUserById(user.id, {
    app_metadata: {
      ...user.app_metadata,
      business_name: business?.name ?? user.app_metadata?.business_name,
      onboarding_completed: true,
    },
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
