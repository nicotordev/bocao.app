"use client";

import Link from "next/link";
import type { NavItem } from "@/lib/navigation";
import {
  TbBrandWhatsapp,
  TbCalendarEvent,
  TbChartBar,
  TbChefHat,
  TbClipboardList,
  TbLayoutGrid,
  TbLayoutDashboard,
  TbSettings,
  TbSparkles,
  TbToolsKitchen2,
  TbUsers,
  TbUsersGroup,
} from "react-icons/tb";
import type { IconType } from "react-icons";
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
  dashboard: TbLayoutDashboard,
  orders: TbClipboardList,
  reservations: TbCalendarEvent,
  floorPlan: TbLayoutGrid,
  whatsapp: TbBrandWhatsapp,
  menu: TbToolsKitchen2,
  kitchen: TbChefHat,
  customers: TbUsers,
  marketing: TbSparkles,
  analytics: TbChartBar,
  team: TbUsersGroup,
  settings: TbSettings,
} satisfies Record<NavItem["icon"], IconType>;

export function DashboardNavItem({ item, isActive }: DashboardNavItemProps) {
  const Icon = navIcons[item.icon];

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        isActive={isActive}
        tooltip={item.label}
        className={cn(
          "transition-all duration-200 rounded-xl relative group/nav-item py-2.5",
          isActive
            ? "bg-primary/10 text-primary font-medium hover:bg-primary/15"
            : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/50",
        )}
      >
        <Link href={item.href} aria-current={isActive ? "page" : undefined}>
          <Icon className={cn(
            "size-4 shrink-0 transition-transform duration-200 group-hover/nav-item:scale-110",
            isActive ? "text-primary" : "text-muted-foreground group-hover/nav-item:text-foreground"
          )} aria-hidden />
          <span>{item.label}</span>
          {isActive && (
            <span className="absolute right-2 top-1/2 -translate-y-1/2 size-1.5 rounded-full bg-primary animate-pulse group-data-[collapsible=icon]:hidden" />
          )}
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

