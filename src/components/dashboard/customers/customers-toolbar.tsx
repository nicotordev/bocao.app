"use client";

import { SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  CustomerChannel,
  CustomerSegment,
  CustomerSortField,
} from "@/lib/customers/types";
import type { CustomersLabels } from "./types";

export type CustomersToolbarState = {
  search: string;
  segment: CustomerSegment | "all";
  channel: CustomerChannel | "all";
  sort: CustomerSortField;
};

type CustomersToolbarProps = {
  labels: CustomersLabels;
  value: CustomersToolbarState;
  onSearchChange: (search: string) => void;
  onFiltersChange: (
    value: Omit<CustomersToolbarState, "search">,
  ) => void;
  onClear?: () => void;
};

const segmentOptions: Array<CustomerSegment | "all"> = [
  "all",
  "frequent",
  "new",
  "vip",
  "inactive",
  "at_risk",
  "whatsapp",
];

const channelOptions: Array<CustomerChannel | "all"> = [
  "all",
  "whatsapp",
  "web",
  "in_person",
  "delivery",
  "reservation",
];

const sortOptions: CustomerSortField[] = [
  "last_visit",
  "total_spend",
  "order_count",
  "name",
  "created_at",
];

function segmentLabel(
  labels: CustomersLabels,
  segment: CustomerSegment | "all",
) {
  if (segment === "all") {
    return labels.segments.all;
  }

  if (segment === "at_risk") {
    return labels.segments.atRisk;
  }

  if (segment === "high_value") {
    return labels.segments.highValue;
  }

  return labels.segments[segment];
}

function FilterFields({
  labels,
  value,
  onSearchChange,
  onFiltersChange,
  onClear,
}: CustomersToolbarProps) {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      <div className="space-y-2 md:col-span-2 xl:col-span-1">
        <Label htmlFor="customers-search">{labels.toolbar.search}</Label>
        <Input
          id="customers-search"
          value={value.search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder={labels.toolbar.searchPlaceholder}
        />
      </div>

      <div className="space-y-2">
        <Label>{labels.toolbar.segment}</Label>
        <Select
          value={value.segment}
          onValueChange={(segment) =>
            onFiltersChange({
              segment: segment as CustomerSegment | "all",
              channel: value.channel,
              sort: value.sort,
            })
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {segmentOptions.map((segment) => (
              <SelectItem key={segment} value={segment}>
                {segmentLabel(labels, segment)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>{labels.toolbar.channel}</Label>
        <Select
          value={value.channel}
          onValueChange={(channel) =>
            onFiltersChange({
              segment: value.segment,
              channel: channel as CustomerChannel | "all",
              sort: value.sort,
            })
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
        <Label>{labels.toolbar.sort}</Label>
        <Select
          value={value.sort}
          onValueChange={(sort) =>
            onFiltersChange({
              segment: value.segment,
              channel: value.channel,
              sort: sort as CustomerSortField,
            })
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {sortOptions.map((sort) => (
              <SelectItem key={sort} value={sort}>
                {labels.sort[sort]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {onClear ? (
        <div className="flex items-end md:col-span-2 xl:col-span-4">
          <Button variant="ghost" onClick={onClear}>
            {labels.actions.clearFilters}
          </Button>
        </div>
      ) : null}
    </div>
  );
}

export function CustomersToolbar(props: CustomersToolbarProps) {
  return (
    <div className="sticky top-14 z-20 rounded-3xl border border-border/70 bg-background/90 p-4 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/75 md:top-16">
      <div className="hidden xl:block">
        <FilterFields {...props} />
      </div>

      <Collapsible className="xl:hidden">
        <div className="flex items-center justify-between gap-3">
          <Input
            value={props.value.search}
            onChange={(event) => props.onSearchChange(event.target.value)}
            placeholder={props.labels.toolbar.searchPlaceholder}
          />
          <CollapsibleTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              aria-label={props.labels.accessibility.openFilters}
            >
              <SlidersHorizontal className="size-4" aria-hidden />
            </Button>
          </CollapsibleTrigger>
        </div>
        <CollapsibleContent className="mt-3">
          <FilterFields {...props} />
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
