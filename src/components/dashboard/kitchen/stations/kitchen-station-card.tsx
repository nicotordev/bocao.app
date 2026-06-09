"use client";

import { ArrowDown, ArrowUp, Pencil, Power, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { MenuTagIconGlyph } from "@/components/dashboard/menu/menu-tag-icon-picker";
import { getKitchenStationCategoryLabel } from "@/lib/kitchen/stations/display";
import type { KitchenStationWithStats } from "@/lib/kitchen/stations/types";
import { cn } from "@/lib/utils";
import { KitchenStationStatusBadge } from "./kitchen-station-status-badge";
import type { KitchenStationsLabels } from "./types";

type KitchenStationCardProps = {
  station: KitchenStationWithStats;
  labels: KitchenStationsLabels;
  canEdit: boolean;
  isFirst: boolean;
  isLast: boolean;
  onEdit: (station: KitchenStationWithStats) => void;
  onToggleActive: (station: KitchenStationWithStats) => void;
  onDelete: (station: KitchenStationWithStats) => void;
  onMove: (station: KitchenStationWithStats, direction: "up" | "down") => void;
  isMutating?: boolean;
};

const categoryClassName: Record<KitchenStationWithStats["category"], string> = {
  grill: "border-destructive/25 bg-destructive/5",
  fryer: "border-warning/30 bg-warning/10",
  sushi: "border-chart-2/30 bg-chart-2/10",
  bar: "border-chart-4/30 bg-chart-4/10",
  desserts: "border-chart-5/30 bg-chart-5/10",
  delivery: "border-primary/25 bg-primary/5",
  prep: "border-secondary/40 bg-secondary/20",
  other: "border-border bg-muted/30",
};

export function KitchenStationCard({
  station,
  labels,
  canEdit,
  isFirst,
  isLast,
  onEdit,
  onToggleActive,
  onDelete,
  onMove,
  isMutating = false,
}: KitchenStationCardProps) {
  const canDelete = station.activeOrderCount === 0;

  return (
    <Card
      className={cn(
        "overflow-hidden border transition-colors",
        !station.isActive && "opacity-80",
        categoryClassName[station.category],
      )}
    >
      <CardHeader className="gap-3 border-b border-border/60 bg-card/70 pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            {station.imageUrl ? (
              <div className="size-12 shrink-0 overflow-hidden rounded-xl border border-border/70 bg-background/80">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={station.imageUrl}
                  alt=""
                  className="size-full object-cover"
                />
              </div>
            ) : station.iconId ? (
              <div className="flex size-12 shrink-0 items-center justify-center rounded-xl border border-border/70 bg-background/80 text-primary">
                <MenuTagIconGlyph icon={station.iconId} className="size-6" />
              </div>
            ) : null}
            <div className="min-w-0 space-y-1">
            <CardTitle className="truncate text-lg">{station.name}</CardTitle>
            <CardDescription className="line-clamp-2">
              {station.description || labels.card.noDescription}
            </CardDescription>
            </div>
          </div>
          <KitchenStationStatusBadge
            isActive={station.isActive}
            labels={labels.status}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="font-normal">
            {labels.card.category}:{" "}
            {getKitchenStationCategoryLabel(station, labels.categories)}
          </Badge>
          <Badge variant="outline" className="font-normal">
            {labels.card.sortOrder}: {station.sortOrder + 1}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="grid gap-3 py-4">
        <div className="rounded-xl border border-border/70 bg-background/70 px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {labels.card.activeOrders}
          </p>
          <p className="mt-1 font-heading text-2xl font-semibold tabular-nums">
            {labels.card.activeOrdersCount.replace(
              "{count}",
              String(station.activeOrderCount),
            )}
          </p>
        </div>
      </CardContent>

      {canEdit ? (
        <CardFooter className="flex flex-wrap gap-2 border-t border-border/60 bg-card/60 py-4">
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => onEdit(station)}
            disabled={isMutating}
          >
            <Pencil className="size-4" aria-hidden />
            {labels.card.edit}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => onToggleActive(station)}
            disabled={isMutating}
          >
            <Power className="size-4" aria-hidden />
            {station.isActive ? labels.card.deactivate : labels.card.activate}
          </Button>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => onMove(station, "up")}
              disabled={isMutating || isFirst}
              aria-label={labels.card.moveUp}
            >
              <ArrowUp className="size-4" aria-hidden />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => onMove(station, "down")}
              disabled={isMutating || isLast}
              aria-label={labels.card.moveDown}
            >
              <ArrowDown className="size-4" aria-hidden />
            </Button>
          </div>
          {canDelete ? (
            <Button
              variant="destructive"
              size="sm"
              className="ml-auto gap-2"
              onClick={() => onDelete(station)}
              disabled={isMutating}
            >
              <Trash2 className="size-4" aria-hidden />
              {labels.card.delete}
            </Button>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="ml-auto">
                  <Button
                    variant="destructive"
                    size="sm"
                    className="gap-2"
                    disabled
                  >
                    <Trash2 className="size-4" aria-hidden />
                    {labels.card.delete}
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent>{labels.card.deleteBlocked}</TooltipContent>
            </Tooltip>
          )}
        </CardFooter>
      ) : null}
    </Card>
  );
}
