"use client";

import { SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { OrderChannel, OrderStatus, OrdersLabels } from "./types";

export type OrdersFiltersState = {
  search: string;
  status: OrderStatus | "all";
  channel: OrderChannel | "all";
  restaurant: string;
  from: string;
  to: string;
  expanded: boolean;
};

type OrdersFiltersProps = {
  labels: OrdersLabels;
  restaurants: string[];
  value: OrdersFiltersState;
  onChange: (value: OrdersFiltersState) => void;
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

export function OrdersFilters({
  labels,
  restaurants,
  value,
  onChange,
  onClear,
}: OrdersFiltersProps) {
  const update = <K extends keyof OrdersFiltersState>(
    key: K,
    nextValue: OrdersFiltersState[K],
  ) => onChange({ ...value, [key]: nextValue });

  return (
    <section className="sticky top-14 z-20 rounded-3xl border border-border/70 bg-background/90 p-3 shadow-sm backdrop-blur md:top-16">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="flex flex-1 items-center gap-2">
          <Input
            aria-label={labels.filters.search}
            value={value.search}
            onChange={(event) => update("search", event.target.value)}
            placeholder={labels.filters.searchPlaceholder}
            className="h-10 rounded-2xl bg-input/50"
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="shrink-0 lg:hidden"
            aria-label={value.expanded ? labels.filters.collapse : labels.filters.expand}
            onClick={() => update("expanded", !value.expanded)}
          >
            <SlidersHorizontal className="size-4" aria-hidden />
          </Button>
        </div>

        <div
          className={
            value.expanded
              ? "grid gap-2 sm:grid-cols-2 lg:flex"
              : "hidden gap-2 lg:flex"
          }
        >
          <Select
            value={value.status}
            onValueChange={(nextValue) =>
              update("status", nextValue as OrdersFiltersState["status"])
            }
          >
            <SelectTrigger className="w-full lg:w-44" aria-label={labels.filters.status}>
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

          <Select
            value={value.channel}
            onValueChange={(nextValue) =>
              update("channel", nextValue as OrdersFiltersState["channel"])
            }
          >
            <SelectTrigger className="w-full lg:w-40" aria-label={labels.filters.channel}>
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

          <Select
            value={value.restaurant}
            onValueChange={(nextValue) => update("restaurant", nextValue)}
          >
            <SelectTrigger className="w-full lg:w-48" aria-label={labels.filters.restaurant}>
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

          <Button type="button" variant="ghost" className="gap-2" onClick={onClear}>
            <X className="size-4" aria-hidden />
            {labels.actions.clearFilters}
          </Button>
        </div>
      </div>
    </section>
  );
}
