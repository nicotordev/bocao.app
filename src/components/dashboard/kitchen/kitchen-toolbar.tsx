"use client";

import {
  TbAdjustmentsHorizontal,
  TbCalendar,
  TbChevronDown,
  TbLayoutGrid,
  TbList,
  TbSearch,
} from "react-icons/tb";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { KitchenFiltersState, KitchenViewMode } from "@/lib/kitchen/types";
import type { KitchenLabels } from "./types";

type KitchenToolbarProps = {
  labels: KitchenLabels;
  filters: KitchenFiltersState;
  date: string;
  onDateChange: (date: string) => void;
  view: KitchenViewMode;
  onFiltersChange: (filters: KitchenFiltersState) => void;
  onViewChange: (view: KitchenViewMode) => void;
  onClearFilters: () => void;
};

const stations = [
  "all",
  "grill",
  "fryer",
  "sushi",
  "bar",
  "desserts",
  "delivery_station",
] as const;

const priorities = ["all", "normal", "high", "urgent", "delayed"] as const;

const channels = ["all", "whatsapp", "web", "table", "delivery", "pickup"] as const;

const views: KitchenViewMode[] = ["cards", "kanban", "timeline"];

export function KitchenToolbar({
  labels,
  filters,
  date,
  onDateChange,
  view,
  onFiltersChange,
  onViewChange,
  onClearFilters,
}: KitchenToolbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const hasActiveFilters =
    filters.search.trim().length > 0 ||
    filters.station !== "all" ||
    filters.priority !== "all" ||
    filters.channel !== "all";

  const filterFields = (
    <>
      <div className="min-w-0 flex-1 space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground">
          {labels.toolbar.search}
        </label>
        <div className="relative">
          <TbSearch className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={filters.search}
            onChange={(event) =>
              onFiltersChange({ ...filters, search: event.target.value })
            }
            placeholder={labels.toolbar.searchPlaceholder}
            className="pl-9"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground">
          {labels.toolbar.station}
        </label>
        <Select
          value={filters.station}
          onValueChange={(value) =>
            onFiltersChange({
              ...filters,
              station: value as KitchenFiltersState["station"],
            })
          }
        >
          <SelectTrigger className="w-full min-w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {stations.map((station) => (
              <SelectItem key={station} value={station}>
                {labels.stations[station]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground">
          {labels.toolbar.priority}
        </label>
        <Select
          value={filters.priority}
          onValueChange={(value) =>
            onFiltersChange({
              ...filters,
              priority: value as KitchenFiltersState["priority"],
            })
          }
        >
          <SelectTrigger className="w-full min-w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {priorities.map((priority) => (
              <SelectItem key={priority} value={priority}>
                {labels.priorities[priority]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground">
          {labels.toolbar.channel}
        </label>
        <Select
          value={filters.channel}
          onValueChange={(value) =>
            onFiltersChange({
              ...filters,
              channel: value as KitchenFiltersState["channel"],
            })
          }
        >
          <SelectTrigger className="w-full min-w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {channels.map((channel) => (
              <SelectItem key={channel} value={channel}>
                {labels.channels[channel]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="kitchen-filter-date"
          className="text-xs font-medium text-muted-foreground"
        >
          {labels.toolbar.date}
        </label>
        <div className="relative">
          <TbCalendar
            className="pointer-events-none absolute top-1/2 left-3 z-10 size-4 -translate-y-1/2 text-foreground/75"
            aria-hidden
          />
          <Input
            id="kitchen-filter-date"
            type="date"
            value={date}
            onChange={(event) => onDateChange(event.target.value)}
            className="w-full min-w-36 pl-9 dark:[color-scheme:dark] [&::-webkit-calendar-picker-indicator]:ml-auto [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-90 dark:[&::-webkit-calendar-picker-indicator]:invert"
          />
        </div>
      </div>
    </>
  );

  return (
    <div className="sticky top-0 z-20 -mx-4 border-b border-border/60 bg-background/90 px-4 py-3 backdrop-blur-md md:-mx-6 md:px-6">
      <div className="space-y-3">
        <div className="flex flex-col gap-3 lg:hidden">
          <Collapsible open={mobileOpen} onOpenChange={setMobileOpen}>
            <div className="flex items-center gap-2">
              <CollapsibleTrigger asChild>
                <Button variant="outline" className="flex-1 gap-2">
                  <TbAdjustmentsHorizontal className="size-4" />
                  {labels.actions.toggleFilters}
                  <TbChevronDown
                    className={
                      mobileOpen
                        ? "size-4 rotate-180 transition-transform"
                        : "size-4 transition-transform"
                    }
                  />
                </Button>
              </CollapsibleTrigger>
              {hasActiveFilters ? (
                <Button variant="ghost" size="sm" onClick={onClearFilters}>
                  {labels.actions.clearFilters}
                </Button>
              ) : null}
            </div>
            <CollapsibleContent className="mt-3 grid gap-3">
              {filterFields}
            </CollapsibleContent>
          </Collapsible>
        </div>

        <div className="hidden items-end gap-3 lg:grid lg:grid-cols-[minmax(0,1.4fr)_repeat(4,minmax(0,0.7fr))_auto]">
          {filterFields}
          {hasActiveFilters ? (
            <Button variant="ghost" size="sm" onClick={onClearFilters}>
              {labels.actions.clearFilters}
            </Button>
          ) : null}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs font-medium text-muted-foreground">
            {labels.toolbar.view}
          </p>
          <Tabs
            value={view}
            onValueChange={(value) => onViewChange(value as KitchenViewMode)}
          >
            <TabsList className="grid w-full grid-cols-3 sm:w-auto">
              {views.map((mode) => (
                <TabsTrigger key={mode} value={mode} className="gap-1.5">
                  {mode === "cards" ? (
                    <TbLayoutGrid className="size-3.5" aria-hidden />
                  ) : mode === "kanban" ? (
                    <TbList className="size-3.5" aria-hidden />
                  ) : (
                    <TbList className="size-3.5 rotate-90" aria-hidden />
                  )}
                  {labels.views[mode]}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
