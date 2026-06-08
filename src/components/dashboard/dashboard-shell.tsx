"use client";

import type { DashboardContext } from "@/lib/dashboard/types";
import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { DashboardTopbar } from "@/components/dashboard/dashboard-topbar";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";

type DashboardShellProps = {
  context: DashboardContext;
  children: React.ReactNode;
};

export function DashboardShell({ context, children }: DashboardShellProps) {
  return (
    <SidebarProvider defaultOpen>
      <AppSidebar
        navigation={context.navigation}
        organization={context.organization}
        restaurants={context.restaurants}
        activeRestaurant={context.activeRestaurant}
        membership={context.membership}
      />
      <SidebarInset className="min-h-svh bg-background">
        <DashboardTopbar
          user={context.user}
          membership={context.membership}
          activeRestaurant={context.activeRestaurant}
        />
        <div className="flex-1">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
