"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  TbBuildingStore,
  TbChevronDown,
  TbCirclePlus,
  TbLayoutGrid,
} from "react-icons/tb";
import { CreateRestaurantDialog } from "@/components/dashboard/create-restaurant-dialog";
import { useSwitchRestaurantMutation } from "@/lib/query/restaurant/restaurant.mutations";
import type {
  DashboardOrganizationGroup,
  DashboardRestaurant,
} from "@/lib/dashboard/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const ORGANIZATIONS_OVERVIEW_PATH = "/dashboard/organizations";

type TenantSwitcherProps = {
  organizationId: string;
  organizationName: string;
  organizations: DashboardOrganizationGroup[];
  restaurants: DashboardRestaurant[];
  activeRestaurant: DashboardRestaurant | null;
  canCreateRestaurant?: boolean;
  className?: string;
};

export function TenantSwitcher({
  organizationId,
  organizationName,
  organizations,
  restaurants,
  activeRestaurant,
  canCreateRestaurant = false,
  className,
}: TenantSwitcherProps) {
  const t = useTranslations("dashboard.shell");
  const tTenant = useTranslations("dashboard.shell.tenantSwitcher");
  const pathname = usePathname();
  const switchRestaurantMutation = useSwitchRestaurantMutation();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const isOverviewActive = pathname === ORGANIZATIONS_OVERVIEW_PATH;
  const hasMultipleOrganizations = organizations.length > 1;
  const showOrganizationGroups = hasMultipleOrganizations;

  const createDefaults = useMemo(() => {
    const organizationRestaurants =
      organizations.find((organization) => organization.id === organizationId)
        ?.restaurants ?? restaurants;
    const defaultRestaurant =
      activeRestaurant ??
      organizationRestaurants.find(
        (restaurant) => restaurant.organizationId === organizationId,
      ) ??
      organizationRestaurants[0] ??
      null;

    return {
      currency: defaultRestaurant?.currency,
      timezone: defaultRestaurant?.timezone,
    };
  }, [activeRestaurant, organizationId, organizations, restaurants]);

  const handleSelect = (restaurantId: string) => {
    switchRestaurantMutation.mutate(restaurantId);
  };

  const triggerTitle = isOverviewActive
    ? tTenant("allOrganizations")
    : (activeRestaurant?.name ?? t("noActiveRestaurant"));

  const triggerSubtitle = isOverviewActive
    ? tTenant("allOrganizationsHint")
    : organizationName;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          disabled={switchRestaurantMutation.isPending}
          className={cn(
            "h-auto min-h-11 w-full justify-between gap-2.5 rounded-xl border-sidebar-border bg-sidebar-accent/20 px-3.5 py-2 text-left font-normal transition-all hover:bg-sidebar-accent/50 hover:border-sidebar-border/80 focus-visible:ring-1 focus-visible:ring-primary/30",
            className,
          )}
        >
          <span className="flex min-w-0 items-center gap-2.5">
            <span className="flex size-7.5 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary shadow-sm">
              {isOverviewActive ? (
                <TbLayoutGrid className="size-4" aria-hidden />
              ) : (
                <TbBuildingStore className="size-4" aria-hidden />
              )}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-xs font-semibold text-foreground/90">
                {triggerTitle}
              </span>
              <span className="block truncate text-[10px] font-medium text-muted-foreground/75">
                {triggerSubtitle}
              </span>
            </span>
          </span>
          <TbChevronDown
            className="size-3.5 shrink-0 text-muted-foreground/70 transition-transform duration-200"
            aria-hidden
          />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="max-h-[min(24rem,70vh)] w-64 overflow-y-auto rounded-xl border-border/40 p-1 shadow-md"
      >
        <DropdownMenuItem
          asChild
          className={cn(
            "flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs transition-colors cursor-pointer",
            isOverviewActive
              ? "bg-primary/10 text-primary font-medium hover:bg-primary/15"
              : "hover:bg-accent text-foreground/80 hover:text-foreground",
          )}
        >
          <Link href={ORGANIZATIONS_OVERVIEW_PATH}>
            <TbLayoutGrid className="size-3.5 shrink-0" aria-hidden />
            <span>{tTenant("allOrganizations")}</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator className="opacity-50" />

        {restaurants.length === 0 ? (
          <DropdownMenuItem disabled className="px-2.5 py-1.5 text-xs">
            {tTenant("noLocations")}
          </DropdownMenuItem>
        ) : showOrganizationGroups ? (
          organizations.map((organization) => (
            <div key={organization.id}>
              <DropdownMenuLabel className="px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80">
                {organization.name}
              </DropdownMenuLabel>
              {organization.restaurants.map((restaurant) => (
                <DropdownMenuItem
                  key={restaurant.id}
                  onSelect={() => handleSelect(restaurant.id)}
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs transition-colors cursor-pointer",
                    restaurant.id === activeRestaurant?.id && !isOverviewActive
                      ? "bg-primary/10 text-primary font-medium hover:bg-primary/15"
                      : "text-foreground/80 hover:bg-accent hover:text-foreground",
                  )}
                >
                  <TbBuildingStore className="size-3.5 shrink-0" aria-hidden />
                  <span className="truncate">{restaurant.name}</span>
                </DropdownMenuItem>
              ))}
            </div>
          ))
        ) : (
          <>
            <DropdownMenuLabel className="px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80">
              {tTenant("locations")}
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="opacity-50" />
            {restaurants.map((restaurant) => (
              <DropdownMenuItem
                key={restaurant.id}
                onSelect={() => handleSelect(restaurant.id)}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs transition-colors cursor-pointer",
                  restaurant.id === activeRestaurant?.id && !isOverviewActive
                    ? "bg-primary/10 text-primary font-medium hover:bg-primary/15"
                    : "hover:bg-accent text-foreground/80 hover:text-foreground",
                )}
              >
                <TbBuildingStore className="size-3.5 shrink-0" aria-hidden />
                <span className="truncate">{restaurant.name}</span>
              </DropdownMenuItem>
            ))}
          </>
        )}

        {canCreateRestaurant ? (
          <>
            <DropdownMenuSeparator className="opacity-50" />
            <DropdownMenuItem
              onSelect={(event) => {
                event.preventDefault();
                setIsCreateOpen(true);
              }}
              className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs text-primary transition-colors cursor-pointer hover:bg-primary/10 hover:text-primary"
            >
              <TbCirclePlus className="size-3.5 shrink-0" aria-hidden />
              <span>{tTenant("createLocation")}</span>
            </DropdownMenuItem>
          </>
        ) : null}
      </DropdownMenuContent>

      {canCreateRestaurant ? (
        <CreateRestaurantDialog
          open={isCreateOpen}
          onOpenChange={setIsCreateOpen}
          organizationId={organizationId}
          organizationName={organizationName}
          defaultCurrency={createDefaults.currency}
          defaultTimezone={createDefaults.timezone}
        />
      ) : null}
    </DropdownMenu>
  );
}
