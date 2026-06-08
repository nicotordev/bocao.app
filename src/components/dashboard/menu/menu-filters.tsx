"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import type { MenuPageLabels } from "./types";

type MenuFiltersProps = {
  labels: MenuPageLabels;
  search: string;
  showUnavailable: boolean;
  onSearchChange: (value: string) => void;
  onShowUnavailableChange: (value: boolean) => void;
  onClear: () => void;
};

export function MenuFilters({
  labels,
  search,
  showUnavailable,
  onSearchChange,
  onShowUnavailableChange,
  onClear,
}: MenuFiltersProps) {
  const hasActiveFilters = search.trim().length > 0 || !showUnavailable;

  return (
    <div className="flex flex-col gap-4 rounded-3xl border border-border bg-card p-4 md:flex-row md:items-end md:flex-wrap">
      <div className="min-w-[200px] flex-1 space-y-2">
        <Label htmlFor="menu-search">{labels.filters.search}</Label>
        <Input
          id="menu-search"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder={labels.filters.searchPlaceholder}
          className="rounded-2xl"
        />
      </div>

      <div className="flex min-h-10 items-center gap-3 rounded-2xl border border-border px-3">
        <Switch
          id="menu-show-unavailable"
          checked={showUnavailable}
          onCheckedChange={onShowUnavailableChange}
        />
        <Label htmlFor="menu-show-unavailable" className="cursor-pointer">
          {labels.filters.showUnavailable}
        </Label>
      </div>

      {hasActiveFilters ? (
        <Button variant="ghost" className="rounded-2xl" onClick={onClear}>
          {labels.filters.clear}
        </Button>
      ) : null}
    </div>
  );
}
