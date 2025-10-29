import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Button } from "@/components/ui/button";
import Image from "next/image";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-14 items-center gap-2 border-b px-4">
          <SidebarTrigger />
          <div className="flex items-center gap-2">
            <Image src="/TT_logo.png" alt="TinyTrees" width={20} height={20} />
            <span className="text-sm font-medium">Dashboard</span>
          </div>
          <div className="ml-auto">
            <form action="/auth/signout" method="post">
              <Button type="submit" variant="secondary" size="sm">Sign out</Button>
            </form>
          </div>
        </header>
        <div className="flex-1 p-4">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}


