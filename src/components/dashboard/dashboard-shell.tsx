"use client";

import { useState } from "react";
import type { DashboardContext } from "@/lib/dashboard/types";
import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { CompleteProfileNameDialog } from "@/components/dashboard/complete-profile-name-dialog";
import { DashboardTopbar } from "@/components/dashboard/dashboard-topbar";
import {
  DashboardFocusModeProvider,
  useDashboardFocusMode,
} from "@/components/dashboard/dashboard-focus-mode";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";

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
  const pathname = usePathname();
  const [profileNameCompleted, setProfileNameCompleted] = useState(false);

  const isFloorPlanPage = pathname.startsWith("/dashboard/floor-plan");
  const shouldPromptProfileName =
    context.user.needsProfileName && !profileNameCompleted;
  const profileNameDialog = (
    <CompleteProfileNameDialog
      open={shouldPromptProfileName}
      currentName={context.user.name}
      onCompleted={() => setProfileNameCompleted(true)}
    />
  );

  if (isFloorPlanPage) {
    return (
      <>
        {profileNameDialog}
        {children}
      </>
    );
  }

  return (
    <SidebarProvider
      defaultOpen
      style={
        {
          "--sidebar-width-icon": "4rem",
        } as React.CSSProperties
      }
    >
      {profileNameDialog}
      {isFocused ? null : (
        <AppSidebar
          user={context.user}
          navigation={context.navigation}
          organization={context.organization}
          organizations={context.organizations}
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
        <div
          className={cn(
            "flex min-h-0 flex-1 flex-col",
            isFocused && "h-full",
          )}
        >
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
