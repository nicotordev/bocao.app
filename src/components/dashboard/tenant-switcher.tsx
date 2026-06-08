"use client";

import { IconBuildingStore, IconChevronDown } from "@tabler/icons-react";
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
            "h-auto min-h-10 w-full justify-between gap-2 border-sidebar-border bg-sidebar/60 px-3 py-2 text-left font-normal hover:bg-sidebar-accent",
            className,
          )}
        >
          <span className="flex min-w-0 items-center gap-2">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <IconBuildingStore className="size-4" aria-hidden />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium">
                {activeRestaurant?.name ?? "Sin local activo"}
              </span>
              <span className="block truncate text-xs text-muted-foreground">
                {organizationName}
              </span>
            </span>
          </span>
          <IconChevronDown
            className="size-4 shrink-0 text-muted-foreground"
            aria-hidden
          />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel>Restaurantes</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {restaurants.length === 0 ? (
          <DropdownMenuItem disabled>
            No hay restaurantes configurados
          </DropdownMenuItem>
        ) : (
          restaurants.map((restaurant) => (
            <DropdownMenuItem
              key={restaurant.id}
              onSelect={() => handleSelect(restaurant.id)}
              className={cn(
                restaurant.id === activeRestaurant?.id && "bg-accent",
              )}
            >
              <IconBuildingStore className="size-4" aria-hidden />
              <span className="truncate">{restaurant.name}</span>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
