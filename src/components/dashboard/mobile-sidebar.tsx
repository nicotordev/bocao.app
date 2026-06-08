"use client";

import { usePathname } from "next/navigation";
import type { DashboardContext } from "@/lib/dashboard/types";
import { DashboardNavItem } from "@/components/dashboard/nav-item";
import { TenantSwitcher } from "@/components/dashboard/tenant-switcher";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  SidebarMenu,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
} from "@/components/ui/sidebar";

type MobileSidebarProps = Pick<
  DashboardContext,
  "navigation" | "organization" | "restaurants" | "activeRestaurant"
>;

export function MobileSidebar({
  navigation,
  organization,
  restaurants,
  activeRestaurant,
}: MobileSidebarProps) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-sidebar-border p-4">
        <TenantSwitcher
          organizationName={organization.name}
          restaurants={restaurants}
          activeRestaurant={activeRestaurant}
        />
      </div>
      <ScrollArea className="flex-1 p-4">
        <SidebarGroup>
          <SidebarGroupLabel>Módulos</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigation.map((item) => (
                <DashboardNavItem
                  key={item.id}
                  item={item}
                  isActive={
                    item.href === "/dashboard"
                      ? pathname === "/dashboard"
                      : pathname.startsWith(item.href)
                  }
                />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </ScrollArea>
      <Separator />
      <p className="p-4 text-xs text-muted-foreground">
        Bocao · Sistema operativo para restaurantes
      </p>
    </div>
  );
}
