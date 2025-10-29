"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import Image from "next/image";
import { ShoppingCart, Utensils, LifeBuoy, Truck } from "lucide-react";
import { useNavStore } from "@/lib/stores/nav";
import { useEffect, useState } from "react";

const items = [
  { key: "orders" as const, title: "Orders", icon: ShoppingCart },
  { key: "menu" as const, title: "Menu", icon: Utensils },
  { key: "support" as const, title: "Support", icon: LifeBuoy },
  { key: "drivers" as const, title: "Drivers", icon: Truck },
];

export function AppSidebar() {
  const active = useNavStore((s) => s.activeSection);
  const setActive = useNavStore((s) => s.setActiveSection);
  

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-1.5">
          <Image src="/TT_logo.png" alt="TinyTrees" width={24} height={24} />
          <span className="text-sm font-medium">TinyTrees HQ</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.key}>
                  <SidebarMenuButton
                    isActive={active === item.key}
                    tooltip={item.title}
                    onClick={() => setActive(item.key)}
                  >
                    <item.icon />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarSeparator />
      <SidebarFooter>
        <div className="px-2 text-xs text-sidebar-foreground/70">v1</div>
      </SidebarFooter>
    </Sidebar>
  );
}

export default AppSidebar;


