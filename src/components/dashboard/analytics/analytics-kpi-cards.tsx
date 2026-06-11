"use client";

import {
  TbChefHat,
  TbCurrencyDollar,
  TbReceipt,
  TbTrendingDown,
  TbTrendingUp,
  TbUser,
  TbX,
} from "react-icons/tb";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  formatAnalyticsCurrency,
  formatAnalyticsPercent,
  formatChangePercent,
} from "@/lib/analytics/format";
import type { AnalyticsOverview } from "@/lib/analytics/types";
import type { AnalyticsLabels } from "./types";

type AnalyticsKpiCardsProps = {
  labels: AnalyticsLabels["kpis"];
  overview: AnalyticsOverview;
  currency: string;
  locale: string;
};

const kpiConfig = [
  {
    key: "totalRevenue",
    valueKey: "totalRevenue" as const,
    icon: TbCurrencyDollar,
    accent: "text-primary",
    changeKey: "revenueChangePercent" as const,
  },
  {
    key: "orders",
    icon: TbReceipt,
    accent: "text-chart-2",
    changeKey: "ordersChangePercent" as const,
    valueKey: "totalOrders" as const,
  },
  {
    key: "averageTicket",
    valueKey: "averageTicket" as const,
    icon: TbReceipt,
    accent: "text-chart-4",
    changeKey: null,
  },
  {
    key: "uniqueCustomers",
    valueKey: "uniqueCustomers" as const,
    icon: TbUser,
    accent: "text-chart-1",
    changeKey: null,
  },
  {
    key: "cancellationRate",
    valueKey: "cancellationRate" as const,
    icon: TbX,
    accent: "text-destructive",
    changeKey: null,
  },
  {
    key: "averagePreparationTime",
    valueKey: "averagePreparationMinutes" as const,
    icon: TbChefHat,
    accent: "text-chart-3",
    changeKey: null,
  },
] as const;

function formatKpiValue(
  kpi: (typeof kpiConfig)[number],
  overview: AnalyticsOverview,
  currency: string,
  locale: string,
  labels: AnalyticsLabels["kpis"],
): string {
  switch (kpi.key) {
    case "totalRevenue":
      return formatAnalyticsCurrency(overview.totalRevenue, currency, locale);
    case "orders":
      return String(overview.totalOrders);
    case "averageTicket":
      return formatAnalyticsCurrency(overview.averageTicket, currency, locale);
    case "uniqueCustomers":
      return String(overview.uniqueCustomers);
    case "cancellationRate":
      return formatAnalyticsPercent(overview.cancellationRate);
    case "averagePreparationTime":
      return overview.averagePreparationMinutes !== null
        ? labels.minutesShort.replace(
            "{minutes}",
            String(overview.averagePreparationMinutes),
          )
        : labels.notAvailable;
    default:
      return labels.notAvailable;
  }
}

export function AnalyticsKpiCards({
  labels,
  overview,
  currency,
  locale,
}: AnalyticsKpiCardsProps) {
  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
      {kpiConfig.map((kpi) => {
        const Icon = kpi.icon;
        const change =
          kpi.changeKey !== null ? overview[kpi.changeKey] : null;
        const trend =
          change === null ? "neutral" : change > 0 ? "up" : change < 0 ? "down" : "neutral";
        const TrendIcon =
          trend === "down" ? TbTrendingDown : trend === "up" ? TbTrendingUp : null;

        return (
          <Card
            key={kpi.key}
            size="sm"
            className="border-border/60 bg-card/80 transition duration-200 hover:-translate-y-0.5 hover:bg-card hover:shadow-lg"
          >
            <CardHeader className="grid grid-cols-[1fr_auto] items-start gap-3">
              <div>
                <p className="text-xs font-medium uppercase text-muted-foreground">
                  {labels[kpi.key]}
                </p>
                <CardTitle className="mt-2 text-2xl font-semibold">
                  {formatKpiValue(kpi, overview, currency, locale, labels)}
                </CardTitle>
              </div>
              <div className="rounded-2xl border border-border bg-muted/40 p-2">
                <Icon className={`size-4 ${kpi.accent}`} aria-hidden />
              </div>
            </CardHeader>
            <CardContent>
              <Badge variant="outline" className="gap-1">
                {TrendIcon ? <TrendIcon className="size-3" aria-hidden /> : null}
                {change !== null
                  ? `${formatChangePercent(change)} ${labels.vsPrevious}`
                  : labels.notAvailable}
              </Badge>
            </CardContent>
          </Card>
        );
      })}
    </section>
  );
}
