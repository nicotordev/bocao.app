"use client";

import { TbCalendar, TbReceipt, TbUsers } from "react-icons/tb";
import type { CustomerInsights } from "@/lib/analytics/types";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { AnalyticsLabels } from "./types";

type CustomerInsightsCardProps = {
  title: string;
  data: CustomerInsights;
  labels: AnalyticsLabels;
};

const metrics = [
  {
    key: "uniqueCustomers",
    labelKey: "uniqueCustomers",
    icon: TbUsers,
  },
  {
    key: "customersWithOrders",
    labelKey: "customersWithOrders",
    icon: TbReceipt,
  },
  {
    key: "reservationCount",
    labelKey: "reservations",
    icon: TbCalendar,
  },
] as const;

export function CustomerInsightsCard({
  title,
  data,
  labels,
}: CustomerInsightsCardProps) {
  return (
    <Card className="border-border/60 bg-card/80">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          const label = labels.customerInsights[metric.labelKey];
          const value = data[metric.key];

          return (
            <div
              key={metric.key}
              className="flex items-center justify-between rounded-2xl border border-border/60 bg-muted/20 p-4"
            >
              <div className="flex items-center gap-3">
                <div className="rounded-xl border border-border bg-background p-2">
                  <Icon className="size-4 text-primary" aria-hidden />
                </div>
                <p className="text-sm text-muted-foreground">{label}</p>
              </div>
              <p className="text-xl font-semibold tabular-nums">{value}</p>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
