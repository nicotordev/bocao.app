"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { TbFlame } from "react-icons/tb";
import type { DashboardContext } from "@/lib/dashboard/types";
import { DashboardNavItem } from "@/components/dashboard/nav-item";
import { TenantSwitcher } from "@/components/dashboard/tenant-switcher";
import { MobileSidebar } from "@/components/dashboard/mobile-sidebar";
import { UserMenu } from "@/components/dashboard/user-menu";
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

type AppSidebarProps = Pick<
  DashboardContext,
  | "user"
  | "navigation"
  | "organization"
  | "restaurants"
  | "activeRestaurant"
  | "membership"
>;

export function AppSidebar({
  user,
  navigation,
  organization,
  restaurants,
  activeRestaurant,
  membership,
}: AppSidebarProps) {
  const pathname = usePathname();
  const { isMobile } = useSidebar();
  const t = useTranslations("dashboard.shell");

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

  const groupKeys = [
    "inicio",
    "operaciones",
    "clientes",
    "administracion",
  ] as const;

  const groupedNavigation = navigation.reduce(
    (acc, item) => {
      if (!acc[item.group]) {
        acc[item.group] = [];
      }
      acc[item.group].push(item);
      return acc;
    },
    {} as Record<string, typeof navigation>,
  );

  return (
    <Sidebar collapsible="icon" variant="sidebar">
      <SidebarHeader className="gap-3.5 p-3.5 transition-none group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:gap-2 group-data-[collapsible=icon]:px-2 group-data-[collapsible=icon]:py-3">
        <Link
          href="/dashboard"
          className="flex items-center gap-2.5 rounded-xl px-2 py-1.5 transition-colors duration-150 hover:bg-primary/20 group group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0 group-data-[collapsible=icon]:p-0"
        >
          <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm transition-transform duration-150 group-hover:scale-105 group-hover:rotate-3">
            <TbFlame className="size-4.5" aria-hidden />
          </span>
          <span className="flex min-w-0 flex-col group-data-[collapsible=icon]:hidden">
            <span className="truncate font-heading text-sm font-semibold tracking-tight text-sidebar-foreground">
              Bocao
            </span>
            <span className="truncate text-[10px] font-medium uppercase tracking-wider text-muted-foreground/80">
              {t("brandSubtitle")}
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

      <SidebarSeparator className="opacity-50" />

      <SidebarContent className="gap-4 py-2 transition-none group-data-[collapsible=icon]:items-center">
        {groupKeys.map((groupKey) => {
          const items = groupedNavigation[groupKey];
          if (!items || items.length === 0) return null;

          return (
            <SidebarGroup
              key={groupKey}
              className="px-2 group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:px-0"
            >
              <SidebarGroupLabel className="px-3 text-[10px] font-bold uppercase tracking-wider text-sidebar-accent-foreground/60">
                {t(`navGroups.${groupKey}`)}
              </SidebarGroupLabel>
              <SidebarGroupContent className="group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:flex-col group-data-[collapsible=icon]:items-center">
                <SidebarMenu className="group-data-[collapsible=icon]:items-center">
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
      </SidebarContent>

      <SidebarFooter className="p-3 bg-sidebar-accent/70 transition-none group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:px-2 group-data-[collapsible=icon]:py-3">
        <UserMenu
          user={user}
          roleName={membership.roleName}
          variant="sidebar"
        />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
