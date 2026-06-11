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
import type { AnalyticsListFilters } from "@/lib/analytics/filters";
import type {
  AnalyticsChannel,
  AnalyticsDatePreset,
  AnalyticsOrderStatus,
} from "@/lib/analytics/types";
import type { AnalyticsLabels, AnalyticsRestaurantOption } from "./types";

const presetOptions: AnalyticsDatePreset[] = [
  "today",
  "yesterday",
  "last7days",
  "last30days",
  "thisMonth",
  "lastMonth",
  "custom",
];

const channelOptions: Array<AnalyticsChannel | "all"> = [
  "all",
  "pos",
  "whatsapp",
  "web",
  "delivery",
  "manual",
];

const statusOptions: AnalyticsOrderStatus[] = [
  "all",
  "confirmed",
  "completed",
  "cancelled",
];

type AnalyticsFiltersProps = {
  labels: AnalyticsLabels;
  restaurants: AnalyticsRestaurantOption[];
  activeRestaurantId: string;
  value: AnalyticsListFilters;
  onChange: (value: AnalyticsListFilters) => void;
  onRestaurantChange: (restaurantId: string) => void;
  onClear: () => void;
};

function countActiveFilters(value: AnalyticsListFilters) {
  let count = 0;

  if (value.preset !== "last7days") {
    count += 1;
  }

  if (value.channel !== "all") {
    count += 1;
  }

  if (value.status !== "all") {
    count += 1;
  }

  return count;
}

export function AnalyticsFilters({
  labels,
  restaurants,
  activeRestaurantId,
  value,
  onChange,
  onRestaurantChange,
  onClear,
}: AnalyticsFiltersProps) {
  const activeCount = countActiveFilters(value);

  const update = <K extends keyof AnalyticsListFilters>(
    key: K,
    nextValue: AnalyticsListFilters[K],
  ) => onChange({ ...value, [key]: nextValue });

  return (
    <section className="sticky top-14 z-20 overflow-visible rounded-3xl border border-border/70 bg-background/90 p-3 shadow-sm backdrop-blur md:top-16">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="grid flex-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="space-y-2">
            <Label htmlFor="analytics-filter-restaurant">
              {labels.filters.restaurant}
            </Label>
            <Select value={activeRestaurantId} onValueChange={onRestaurantChange}>
              <SelectTrigger
                id="analytics-filter-restaurant"
                className="w-full rounded-2xl"
              >
                <SelectValue placeholder={labels.filters.restaurant} />
              </SelectTrigger>
              <SelectContent>
                {restaurants.map((restaurant) => (
                  <SelectItem key={restaurant.id} value={restaurant.id}>
                    {restaurant.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="analytics-filter-preset">
              {labels.filters.dateRange}
            </Label>
            <Select
              value={value.preset}
              onValueChange={(nextValue) =>
                update("preset", nextValue as AnalyticsDatePreset)
              }
            >
              <SelectTrigger
                id="analytics-filter-preset"
                className="w-full rounded-2xl"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {presetOptions.map((preset) => (
                  <SelectItem key={preset} value={preset}>
                    {labels.filters.presets[preset]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {value.preset === "custom" ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="analytics-filter-from">{labels.filters.from}</Label>
                <Input
                  id="analytics-filter-from"
                  type="date"
                  value={value.from}
                  onChange={(event) => update("from", event.target.value)}
                  className="h-10 rounded-2xl bg-input/50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="analytics-filter-to">{labels.filters.to}</Label>
                <Input
                  id="analytics-filter-to"
                  type="date"
                  value={value.to}
                  onChange={(event) => update("to", event.target.value)}
                  className="h-10 rounded-2xl bg-input/50"
                />
              </div>
            </>
          ) : null}
        </div>

        <Popover>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              className="h-10 gap-2 rounded-2xl px-4"
            >
              <TbFilter className="size-4" aria-hidden />
              {labels.filters.channel}
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
          <PopoverContent align="end" className="w-80 p-4">
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label>{labels.filters.channel}</Label>
                <Select
                  value={value.channel}
                  onValueChange={(nextValue) =>
                    update("channel", nextValue as AnalyticsListFilters["channel"])
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
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
                <Label>{labels.filters.status}</Label>
                <Select
                  value={value.status}
                  onValueChange={(nextValue) =>
                    update("status", nextValue as AnalyticsOrderStatus)
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
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
