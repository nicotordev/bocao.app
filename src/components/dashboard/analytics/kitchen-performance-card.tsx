"use client";

import { TbChefHat, TbClockExclamation } from "react-icons/tb";
import type { KitchenPerformance } from "@/lib/analytics/types";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { AnalyticsLabels } from "./types";

type KitchenPerformanceCardProps = {
  title: string;
  data: KitchenPerformance | null;
  labels: AnalyticsLabels;
};

export function KitchenPerformanceCard({
  title,
  data,
  labels,
}: KitchenPerformanceCardProps) {
  const hasData =
    data !== null &&
    (data.averagePreparationMinutes !== null ||
      data.delayedOrders > 0 ||
      data.stationStats.length > 0);

  return (
    <Card className="border-border/60 bg-card/80">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <Empty className="border border-dashed border-border/70 bg-muted/10 py-8">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <TbChefHat aria-hidden />
              </EmptyMedia>
              <EmptyTitle>{labels.kitchen.emptyTitle}</EmptyTitle>
              <EmptyDescription className="max-w-sm">
                {labels.kitchen.emptyDescription}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="grid gap-3">
            <div className="flex items-center justify-between rounded-2xl border border-border/60 p-4">
              <div className="flex items-center gap-3">
                <TbChefHat className="size-4 text-chart-2" aria-hidden />
                <span className="text-sm text-muted-foreground">
                  {labels.kitchen.averagePreparation}
                </span>
              </div>
              <span className="font-semibold tabular-nums">
                {data?.averagePreparationMinutes !== null
                  ? labels.kpis.minutesShort.replace(
                      "{minutes}",
                      String(data?.averagePreparationMinutes),
                    )
                  : labels.kpis.notAvailable}
              </span>
            </div>

            <div className="flex items-center justify-between rounded-2xl border border-border/60 p-4">
              <div className="flex items-center gap-3">
                <TbClockExclamation className="size-4 text-destructive" aria-hidden />
                <span className="text-sm text-muted-foreground">
                  {labels.kitchen.delayedOrders}
                </span>
              </div>
              <span className="font-semibold tabular-nums">
                {data?.delayedOrders ?? 0}
              </span>
            </div>

            {data?.stationStats.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                {labels.kitchen.todoStations}
              </p>
            ) : null}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
