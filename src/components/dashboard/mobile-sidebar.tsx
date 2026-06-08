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

  const groupLabels: Record<string, string> = {
    inicio: "Inicio",
    operaciones: "Operaciones",
    clientes: "Clientes & Canales",
    administracion: "Administración",
  };

  const groupKeys: Array<keyof typeof groupLabels> = ["inicio", "operaciones", "clientes", "administracion"];

  const groupedNavigation = navigation.reduce((acc, item) => {
    if (!acc[item.group]) {
      acc[item.group] = [];
    }
    acc[item.group].push(item);
    return acc;
  }, {} as Record<string, typeof navigation>);

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
        <div className="flex flex-col gap-4">
          {groupKeys.map((groupKey) => {
            const items = groupedNavigation[groupKey];
            if (!items || items.length === 0) return null;

            return (
              <SidebarGroup key={groupKey} className="p-0">
                <SidebarGroupLabel className="px-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">
                  {groupLabels[groupKey]}
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {items.map((item) => (
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
            );
          })}
        </div>
      </ScrollArea>
      <Separator />
      <p className="p-4 text-xs text-muted-foreground">
        Bocao · Sistema operativo para restaurantes
      </p>
    </div>
  );
}

