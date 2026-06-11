"use client";

import { formatAnalyticsCurrency } from "@/lib/analytics/format";
import type { PeakHour } from "@/lib/analytics/types";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { AnalyticsLabels } from "./types";
import { getAnalyticsChartColor } from "./chart-colors";

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
            {data.map((row, index) => {
              const intensity = row.orders / maxOrders;
              const color = getAnalyticsChartColor(index);

              return (
                <div
                  key={row.hour}
                  className="rounded-2xl border p-3 transition"
                  style={{
                    borderColor: `color-mix(in oklch, ${color} ${Math.round(25 + intensity * 55)}%, transparent)`,
                    backgroundColor: `color-mix(in oklch, ${color} ${Math.round(8 + intensity * 28)}%, transparent)`,
                  }}
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
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
