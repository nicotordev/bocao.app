"use client";

import { cn } from "@/lib/utils";
import { formatAnalyticsCurrency } from "@/lib/analytics/format";
import type { PeakHour } from "@/lib/analytics/types";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { AnalyticsLabels } from "./types";

type PeakHoursHeatmapProps = {
  title: string;
  data: PeakHour[];
  labels: AnalyticsLabels;
  currency: string;
  locale: string;
};

function formatHour(hour: number): string {
  return `${String(hour).padStart(2, "0")}:00`;
}

export function PeakHoursHeatmap({
  title,
  data,
  labels,
  currency,
  locale,
}: PeakHoursHeatmapProps) {
  const maxOrders = Math.max(...data.map((row) => row.orders), 1);

  return (
    <Card className="border-border/60 bg-card/80">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {data.every((row) => row.orders === 0) ? (
          <p className="text-sm text-muted-foreground">{labels.empty.description}</p>
        ) : (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">
            {data.map((row) => {
              const intensity = row.orders / maxOrders;

              return (
                <div
                  key={row.hour}
                  className={cn(
                    "rounded-2xl border border-border/60 p-3 transition",
                    intensity > 0.7 && "border-primary/40 bg-primary/10",
                    intensity > 0.35 &&
                      intensity <= 0.7 &&
                      "border-chart-2/30 bg-chart-2/10",
                    intensity > 0 &&
                      intensity <= 0.35 &&
                      "bg-muted/30",
                  )}
                >
                  <p className="text-xs font-medium text-muted-foreground">
                    {formatHour(row.hour)}
                  </p>
                  <p className="mt-1 text-lg font-semibold tabular-nums">
                    {row.orders}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatAnalyticsCurrency(row.revenue, currency, locale)}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {labels.charts.orders}: {row.orders}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
