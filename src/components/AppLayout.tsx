import { createSupabaseServerClient } from "@/utils/supabase/server";
import Sidebar from "./Sidebar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Nome do negócio guardado no app_metadata durante o registo — sem query extra à BD
  const businessName =
    (user?.app_metadata?.business_name as string | undefined) ?? "VagasIA";

  return (
    <div className="flex h-screen overflow-hidden bg-[#0F172A]">
      <Sidebar businessName={businessName} />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
