"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconFlame } from "@tabler/icons-react";
import type { DashboardContext } from "@/lib/dashboard/types";
import { DashboardNavItem } from "@/components/dashboard/nav-item";
import { TenantSwitcher } from "@/components/dashboard/tenant-switcher";
import { MobileSidebar } from "@/components/dashboard/mobile-sidebar";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarRail,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";

type AppSidebarProps = Pick<
  DashboardContext,
  "navigation" | "organization" | "restaurants" | "activeRestaurant" | "membership"
>;

export function AppSidebar({
  navigation,
  organization,
  restaurants,
  activeRestaurant,
  membership,
}: AppSidebarProps) {
  const pathname = usePathname();
  const { isMobile } = useSidebar();

  if (isMobile) {
    return (
      <Sidebar collapsible="offcanvas" variant="inset">
        <MobileSidebar
          navigation={navigation}
          organization={organization}
          restaurants={restaurants}
          activeRestaurant={activeRestaurant}
        />
      </Sidebar>
    );
  }

  return (
    <Sidebar collapsible="icon" variant="inset">
      <SidebarHeader className="gap-3 p-3">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 rounded-xl px-2 py-1.5 transition-colors hover:bg-sidebar-accent"
        >
          <span className="flex size-8 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <IconFlame className="size-4" aria-hidden />
          </span>
          <span className="flex min-w-0 flex-col group-data-[collapsible=icon]:hidden">
            <span className="truncate font-heading text-sm font-semibold">
              Bocao
            </span>
            <span className="truncate text-xs text-muted-foreground">
              Restaurant OS
            </span>
          </span>
        </Link>
        <div className="group-data-[collapsible=icon]:hidden">
          <TenantSwitcher
            organizationName={organization.name}
            restaurants={restaurants}
            activeRestaurant={activeRestaurant}
          />
        </div>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent>
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
      </SidebarContent>

      <SidebarFooter className="p-3">
        <div className="rounded-2xl border border-sidebar-border bg-sidebar-accent/40 p-3 group-data-[collapsible=icon]:hidden">
          <div className="mb-1 flex items-center justify-between gap-2">
            <p className="text-xs font-medium text-sidebar-foreground">
              Tu rol
            </p>
            <Badge variant="outline" className="text-[10px] uppercase">
              {membership.roleSlug}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">{membership.roleName}</p>
        </div>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
