"use client";

import { TbChevronDown, TbFilter, TbX } from "react-icons/tb";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { isOrdersDefaultDateRange } from "@/lib/orders/date";
import type { OrderChannel, OrderStatus, OrdersLabels } from "./types";

export type OrdersFiltersState = {
  search: string;
  status: OrderStatus | "all";
  channel: OrderChannel | "all";
  restaurant: string;
  from: string;
  to: string;
};

type OrdersFiltersProps = {
  labels: OrdersLabels;
  restaurants: string[];
  timezone: string;
  value: OrdersFiltersState;
  onSearchChange: (search: string) => void;
  onFiltersChange: (
    value: Omit<OrdersFiltersState, "search" | "restaurant">,
  ) => void;
  onClear: () => void;
};

const statusOptions: Array<OrderStatus | "all"> = [
  "all",
  "received",
  "confirmed",
  "preparing",
  "ready",
  "delivered",
  "cancelled",
];

const channelOptions: Array<OrderChannel | "all"> = [
  "all",
  "whatsapp",
  "web",
  "dineIn",
  "uberEats",
  "rappi",
];

function countActiveFilters(value: OrdersFiltersState, timezone: string) {
  let count = 0;

  if (value.status !== "all") count += 1;
  if (value.channel !== "all") count += 1;
  if (
    !isOrdersDefaultDateRange(value.from, value.to, timezone) &&
    (value.from || value.to)
  ) {
    count += 1;
  }

  return count;
}

function isSelectPortalTarget(target: EventTarget | null) {
  if (!(target instanceof Element)) {
    return false;
  }

  return Boolean(
    target.closest('[data-slot="select-content"]') ||
    target.closest('[data-slot="select-trigger"]'),
  );
}

export function OrdersFilters({
  labels,
  restaurants,
  timezone,
  value,
  onSearchChange,
  onFiltersChange,
  onClear,
}: OrdersFiltersProps) {
  const activeCount = countActiveFilters(value, timezone);

  const update = <K extends keyof OrdersFiltersState>(
    key: K,
    nextValue: OrdersFiltersState[K],
  ) => {
    if (key === "restaurant") {
      return;
    }

    if (key === "search") {
      onSearchChange(String(nextValue));
      return;
    }

    onFiltersChange({
      status: key === "status" ? (nextValue as OrdersFiltersState["status"]) : value.status,
      channel:
        key === "channel" ? (nextValue as OrdersFiltersState["channel"]) : value.channel,
      from: key === "from" ? (nextValue as OrdersFiltersState["from"]) : value.from,
      to: key === "to" ? (nextValue as OrdersFiltersState["to"]) : value.to,
    });
  };

  return (
    <section className="sticky top-14 z-20 overflow-visible rounded-3xl border border-border/70 bg-background/90 p-3 shadow-sm backdrop-blur md:top-16">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          aria-label={labels.filters.search}
          value={value.search}
          onChange={(event) => update("search", event.target.value)}
          placeholder={labels.filters.searchPlaceholder}
          className="h-10 flex-1 rounded-2xl bg-input/50"
        />

        <Popover>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              className="h-10 w-full gap-2 rounded-2xl px-4 sm:w-auto"
              aria-label={labels.filters.menu}
            >
              <TbFilter className="size-4" aria-hidden />
              {labels.filters.menu}
              {activeCount > 0 ? (
                <Badge
                  variant="secondary"
                  className="h-5 min-w-5 justify-center rounded-full px-1.5 text-[10px]"
                >
                  {activeCount}
                </Badge>
              ) : null}
              <TbChevronDown className="size-3.5 opacity-60" aria-hidden />
            </Button>
          </PopoverTrigger>

          <PopoverContent
            align="end"
            sideOffset={8}
            className="w-[min(calc(100vw-2rem),42rem)] p-4"
            onInteractOutside={(event) => {
              if (isSelectPortalTarget(event.target)) {
                event.preventDefault();
              }
            }}
          >
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="orders-filter-status">
                  {labels.filters.status}
                </Label>
                <Select
                  value={value.status}
                  onValueChange={(nextValue) =>
                    update("status", nextValue as OrdersFiltersState["status"])
                  }
                >
                  <SelectTrigger
                    id="orders-filter-status"
                    className="w-full"
                    aria-label={labels.filters.status}
                  >
                    <SelectValue placeholder={labels.filters.status} />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((status) => (
                      <SelectItem key={status} value={status}>
                        {labels.statuses[status]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="orders-filter-channel">
                  {labels.filters.channel}
                </Label>
                <Select
                  value={value.channel}
                  onValueChange={(nextValue) =>
                    update(
                      "channel",
                      nextValue as OrdersFiltersState["channel"],
                    )
                  }
                >
                  <SelectTrigger
                    id="orders-filter-channel"
                    className="w-full"
                    aria-label={labels.filters.channel}
                  >
                    <SelectValue placeholder={labels.filters.channel} />
                  </SelectTrigger>
                  <SelectContent>
                    {channelOptions.map((channel) => (
                      <SelectItem key={channel} value={channel}>
                        {labels.channels[channel]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="orders-filter-restaurant">
                  {labels.filters.restaurant}
                </Label>
                <Select
                  value={value.restaurant}
                  onValueChange={(nextValue) => update("restaurant", nextValue)}
                >
                  <SelectTrigger
                    id="orders-filter-restaurant"
                    className="w-full"
                    aria-label={labels.filters.restaurant}
                  >
                    <SelectValue placeholder={labels.filters.restaurant} />
                  </SelectTrigger>
                  <SelectContent>
                    {restaurants.map((restaurant) => (
                      <SelectItem key={restaurant} value={restaurant}>
                        {restaurant}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{labels.filters.date}</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    aria-label={labels.filters.from}
                    type="date"
                    value={value.from}
                    onChange={(event) => update("from", event.target.value)}
                    className="h-10 rounded-2xl bg-input/50"
                  />
                  <Input
                    aria-label={labels.filters.to}
                    type="date"
                    value={value.to}
                    onChange={(event) => update("to", event.target.value)}
                    className="h-10 rounded-2xl bg-input/50"
                  />
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between gap-3 border-t border-border/60 pt-4">
              <p className="text-xs text-muted-foreground">
                {activeCount > 0
                  ? labels.filters.activeCount.replace(
                      "{count}",
                      String(activeCount),
                    )
                  : labels.filters.noActive}
              </p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="gap-2"
                onClick={onClear}
                disabled={activeCount === 0}
              >
                <TbX className="size-4" aria-hidden />
                {labels.actions.clearFilters}
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </section>
  );
}
