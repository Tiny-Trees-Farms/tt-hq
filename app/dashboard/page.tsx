import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import DashboardContent from "@/components/dashboard/DashboardContent";

export default async function Dashboard() {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  return (
    <DashboardContent />
  );
}