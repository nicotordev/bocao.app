"use client";

import { Cell, Pie, PieChart } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { formatAnalyticsCurrency } from "@/lib/analytics/format";
import type { ChannelBreakdown } from "@/lib/analytics/types";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { AnalyticsLabels } from "./types";
import { getAnalyticsChartColor } from "./chart-colors";

type ChannelBreakdownChartProps = {
  title: string;
  data: ChannelBreakdown[];
  labels: AnalyticsLabels;
  currency: string;
  locale: string;
};

export function ChannelBreakdownChart({
  title,
  data,
  labels,
  currency,
  locale,
}: ChannelBreakdownChartProps) {
  const chartData = data.filter((row) => row.orders > 0);

  const chartConfig = chartData.reduce<ChartConfig>((config, row, index) => {
    config[row.channel] = {
      label: labels.channels[row.channel],
      color: getAnalyticsChartColor(index),
    };
    return config;
  }, {});

  return (
    <Card className="border-border/60 bg-card/80">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <p className="text-sm text-muted-foreground">{labels.empty.description}</p>
        ) : (
          <ChartContainer config={chartConfig} className="mx-auto h-[280px] w-full max-w-md">
            <PieChart>
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value, name, item) => {
                      const revenue = Number(item.payload?.revenue ?? 0);
                      return [
                        `${value} ${labels.charts.orders.toLowerCase()} · ${formatAnalyticsCurrency(revenue, currency, locale)}`,
                        labels.channels[String(name) as keyof typeof labels.channels] ??
                          String(name),
                      ];
                    }}
                  />
                }
              />
              <Pie
                data={chartData}
                dataKey="orders"
                nameKey="channel"
                innerRadius={58}
                outerRadius={102}
                paddingAngle={4}
                stroke="var(--background)"
                strokeWidth={2}
              >
                {chartData.map((row, index) => (
                  <Cell
                    key={row.channel}
                    fill={getAnalyticsChartColor(index)}
                  />
                ))}
              </Pie>
            </PieChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
