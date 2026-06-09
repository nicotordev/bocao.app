"use client";

import { useTranslations } from "next-intl";
import { TbBuildingStore, TbChevronDown } from "react-icons/tb";
import { useSwitchRestaurantMutation } from "@/lib/query/restaurant/restaurant.mutations";
import type { DashboardRestaurant } from "@/lib/dashboard/types";
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

type TenantSwitcherProps = {
  organizationName: string;
  restaurants: DashboardRestaurant[];
  activeRestaurant: DashboardRestaurant | null;
  className?: string;
};

export function TenantSwitcher({
  organizationName,
  restaurants,
  activeRestaurant,
  className,
}: TenantSwitcherProps) {
  const t = useTranslations("dashboard.shell");
  const tTenant = useTranslations("dashboard.shell.tenantSwitcher");
  const switchRestaurantMutation = useSwitchRestaurantMutation();

  const handleSelect = (restaurantId: string) => {
    switchRestaurantMutation.mutate(restaurantId);
  };

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
              <TbBuildingStore className="size-4" aria-hidden />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-xs font-semibold text-foreground/90">
                {activeRestaurant?.name ?? t("noActiveRestaurant")}
              </span>
              <span className="block truncate text-[10px] text-muted-foreground/75 font-medium">
                {organizationName}
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
        className="w-64 rounded-xl p-1 shadow-md border-border/40"
      >
        <DropdownMenuLabel className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80 px-2.5 py-1.5">
          {tTenant("restaurants")}
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="opacity-50" />
        {restaurants.length === 0 ? (
          <DropdownMenuItem disabled className="text-xs px-2.5 py-1.5">
            {tTenant("noRestaurants")}
          </DropdownMenuItem>
        ) : (
          restaurants.map((restaurant) => (
            <DropdownMenuItem
              key={restaurant.id}
              onSelect={() => handleSelect(restaurant.id)}
              className={cn(
                "flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs transition-colors cursor-pointer",
                restaurant.id === activeRestaurant?.id
                  ? "bg-primary/10 text-primary font-medium hover:bg-primary/15"
                  : "hover:bg-accent text-foreground/80 hover:text-foreground",
              )}
            >
              <TbBuildingStore className="size-3.5 shrink-0" aria-hidden />
              <span className="truncate">{restaurant.name}</span>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
