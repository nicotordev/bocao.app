"use client";

import Link from "next/link";
import type { NavItem } from "@/lib/navigation";
import {
  IconBrandWhatsapp,
  IconCalendarEvent,
  IconChartBar,
  IconChefHat,
  IconClipboardList,
  IconLayoutDashboard,
  IconSettings,
  IconSparkles,
  IconToolsKitchen2,
  IconUsers,
  IconUsersGroup,
  type TablerIcon,
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import {
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

type DashboardNavItemProps = {
  item: NavItem;
  isActive: boolean;
};

const navIcons = {
  dashboard: IconLayoutDashboard,
  orders: IconClipboardList,
  reservations: IconCalendarEvent,
  whatsapp: IconBrandWhatsapp,
  menu: IconToolsKitchen2,
  kitchen: IconChefHat,
  customers: IconUsers,
  marketing: IconSparkles,
  analytics: IconChartBar,
  team: IconUsersGroup,
  settings: IconSettings,
} satisfies Record<NavItem["icon"], TablerIcon>;

export function DashboardNavItem({ item, isActive }: DashboardNavItemProps) {
  const Icon = navIcons[item.icon];

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        isActive={isActive}
        tooltip={item.label}
        className={cn(
          "transition-colors",
          isActive &&
            "bg-sidebar-primary/15 text-sidebar-primary hover:bg-sidebar-primary/20 hover:text-sidebar-primary",
        )}
      >
        <Link href={item.href} aria-current={isActive ? "page" : undefined}>
          <Icon className="size-4 shrink-0" aria-hidden />
          <span>{item.label}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}
