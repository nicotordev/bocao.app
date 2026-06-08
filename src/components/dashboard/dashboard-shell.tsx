"use client";

import type { DashboardContext } from "@/lib/dashboard/types";
import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { DashboardTopbar } from "@/components/dashboard/dashboard-topbar";
import {
  DashboardFocusModeProvider,
  useDashboardFocusMode,
} from "@/components/dashboard/dashboard-focus-mode";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

type DashboardShellProps = {
  context: DashboardContext;
  children: React.ReactNode;
};

export function DashboardShell({ context, children }: DashboardShellProps) {
  return (
    <DashboardFocusModeProvider>
      <DashboardShellInner context={context}>{children}</DashboardShellInner>
    </DashboardFocusModeProvider>
  );
}

function DashboardShellInner({ context, children }: DashboardShellProps) {
  const { isFocused } = useDashboardFocusMode();

  return (
    <SidebarProvider defaultOpen>
      {isFocused ? null : (
        <AppSidebar
          user={context.user}
          navigation={context.navigation}
          organization={context.organization}
          restaurants={context.restaurants}
          activeRestaurant={context.activeRestaurant}
          membership={context.membership}
        />
      )}
      <SidebarInset
        className={cn(
          "min-h-svh bg-background",
          isFocused &&
            "fixed inset-0 z-50 max-w-none min-h-0 overflow-hidden shadow-none",
        )}
      >
        {isFocused ? null : (
          <DashboardTopbar
            user={context.user}
            membership={context.membership}
            activeRestaurant={context.activeRestaurant}
          />
        )}
        <div className={cn("flex-1", isFocused && "min-h-0 h-full")}>
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
