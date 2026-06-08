"use client";

import Link from "next/link";
import type { NavItem } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import {
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

type DashboardNavItemProps = {
  item: NavItem;
  isActive: boolean;
};

export function DashboardNavItem({ item, isActive }: DashboardNavItemProps) {
  const Icon = item.icon;

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
