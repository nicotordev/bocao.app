"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { RevenuePoint } from "@/lib/analytics/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type OrdersChartProps = {
  title: string;
  description?: string;
  data: RevenuePoint[];
  ordersLabel: string;
};

export function OrdersChart({
  title,
  description,
  data,
  ordersLabel,
}: OrdersChartProps) {
  const chartConfig = {
    orders: {
      label: ordersLabel,
      color: "var(--chart-2)",
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
          <AreaChart data={data} margin={{ left: 8, right: 8, top: 8 }}>
            <defs>
              <linearGradient id="analyticsOrdersFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--chart-2)" stopOpacity={0.55} />
                <stop offset="55%" stopColor="var(--chart-4)" stopOpacity={0.25} />
                <stop offset="100%" stopColor="var(--chart-5)" stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="analyticsOrdersStroke" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="var(--chart-2)" />
                <stop offset="50%" stopColor="var(--chart-3)" />
                <stop offset="100%" stopColor="var(--primary)" />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={24}
            />
            <YAxis tickLine={false} axisLine={false} width={40} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Area
              type="monotone"
              dataKey="orders"
              stroke="url(#analyticsOrdersStroke)"
              strokeWidth={2.5}
              fill="url(#analyticsOrdersFill)"
              dot={{
                r: 3,
                fill: "var(--chart-1)",
                stroke: "var(--background)",
                strokeWidth: 2,
              }}
              activeDot={{
                r: 5,
                fill: "var(--primary)",
                stroke: "var(--background)",
                strokeWidth: 2,
              }}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
