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

            {data?.busiestStation ? (
              <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {labels.kitchen.busiestStation}
                </p>
                <p className="mt-1 text-base font-semibold">{data.busiestStation}</p>
              </div>
            ) : null}

            {data && data.stationStats.length > 0 ? (
              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {labels.kitchen.stationStats}
                </p>
                <ul className="space-y-2">
                  {data.stationStats.map((stat) => (
                    <li
                      key={stat.station}
                      className="rounded-2xl border border-border/60 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <p className="font-medium">{stat.station}</p>
                        <p className="shrink-0 text-sm font-semibold tabular-nums">
                          {stat.averageMinutes > 0
                            ? labels.kpis.minutesShort.replace(
                                "{minutes}",
                                String(stat.averageMinutes),
                              )
                            : labels.kpis.notAvailable}
                        </p>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                        {stat.orderCount > 0 ? (
                          <span>
                            {labels.kitchen.stationOrders.replace(
                              "{count}",
                              String(stat.orderCount),
                            )}
                          </span>
                        ) : null}
                        {stat.kitchenEvents > 0 ? (
                          <span>
                            {labels.kitchen.stationEvents.replace(
                              "{count}",
                              String(stat.kitchenEvents),
                            )}
                          </span>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
