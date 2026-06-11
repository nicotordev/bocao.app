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

const CHART_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

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
  const chartConfig = data.reduce<ChartConfig>((config, row, index) => {
    config[row.channel] = {
      label: labels.channels[row.channel],
      color: CHART_COLORS[index % CHART_COLORS.length],
    };
    return config;
  }, {});

  const chartData = data.filter((row) => row.orders > 0);

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
                innerRadius={60}
                outerRadius={100}
                paddingAngle={3}
              >
                {chartData.map((row, index) => (
                  <Cell
                    key={row.channel}
                    fill={CHART_COLORS[index % CHART_COLORS.length]}
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
