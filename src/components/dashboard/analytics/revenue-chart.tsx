"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
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

type RevenueChartProps = {
  title: string;
  description?: string;
  data: RevenuePoint[];
  currency: string;
  locale: string;
  revenueLabel: string;
};

const chartConfig = {
  revenue: {
    label: "Revenue",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;

export function RevenueChart({
  title,
  description,
  data,
  currency,
  locale,
  revenueLabel,
}: RevenueChartProps) {
  return (
    <Card className="border-border/60 bg-card/80">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      <CardContent>
        <ChartContainer config={{ ...chartConfig, revenue: { ...chartConfig.revenue, label: revenueLabel } }} className="h-[280px] w-full">
          <BarChart data={data} margin={{ left: 8, right: 8, top: 8 }}>
            <CartesianGrid vertical={false} />
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
            <Bar dataKey="revenue" fill="var(--color-revenue)" radius={6} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
