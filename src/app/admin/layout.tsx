import { redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/utils/supabase/server";

function serviceRoleClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Read fresh app_metadata from the DB via service role — never from JWT
  const { data: { user: fresh } } = await serviceRoleClient().auth.admin.getUserById(user.id);

  if (!fresh?.app_metadata?.is_admin) redirect("/dashboard");

  return <>{children}</>;
}
