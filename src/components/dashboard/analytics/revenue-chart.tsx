"use client";

import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { formatAnalyticsCurrency } from "@/lib/analytics/format";
import type { RevenuePoint } from "@/lib/analytics/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getAnalyticsChartColor } from "./chart-colors";

type RevenueChartProps = {
  title: string;
  description?: string;
  data: RevenuePoint[];
  currency: string;
  locale: string;
  revenueLabel: string;
};

export function RevenueChart({
  title,
  description,
  data,
  currency,
  locale,
  revenueLabel,
}: RevenueChartProps) {
  const chartConfig = {
    revenue: {
      label: revenueLabel,
      color: "var(--chart-1)",
    },
  } satisfies ChartConfig;

  return (
    <Card className="border-border/60 bg-card/80">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[280px] w-full">
          <BarChart data={data} margin={{ left: 8, right: 8, top: 8 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={24}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickFormatter={(value: number) =>
                formatAnalyticsCurrency(value, currency, locale)
              }
              width={72}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value) =>
                    formatAnalyticsCurrency(Number(value), currency, locale)
                  }
                />
              }
            />
            <Bar dataKey="revenue" radius={[6, 6, 0, 0]}>
              {data.map((entry, index) => (
                <Cell
                  key={entry.date}
                  fill={getAnalyticsChartColor(index)}
                />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
