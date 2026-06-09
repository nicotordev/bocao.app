import {
  AlertTriangle,
  ChefHat,
  Clock3,
  PackageCheck,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { KitchenKpiValues } from "@/lib/kitchen/types";
import type { KitchenLabels } from "./types";

type KitchenKpisProps = {
  labels: KitchenLabels["kpis"];
  values: KitchenKpiValues;
};

const kpis = [
  {
    key: "active",
    icon: Clock3,
    trend: "activeTrend",
    accent: "text-chart-4",
    trendIcon: TrendingUp,
    trendClass: "border-primary/30 bg-primary/10 text-primary",
  },
  {
    key: "averageTime",
    icon: ChefHat,
    trend: "averageTrend",
    accent: "text-chart-2",
    trendIcon: TrendingUp,
    trendClass: "border-chart-2/30 bg-chart-2/10 text-chart-2",
  },
  {
    key: "delayed",
    icon: AlertTriangle,
    trend: "delayedTrend",
    accent: "text-destructive",
    trendIcon: TrendingDown,
    trendClass: "border-destructive/30 bg-destructive/10 text-destructive",
  },
  {
    key: "ready",
    icon: PackageCheck,
    trend: "readyTrend",
    accent: "text-chart-1",
    trendIcon: TrendingUp,
    trendClass: "border-chart-1/30 bg-chart-1/10 text-chart-1",
  },
] as const;

export function KitchenKpis({ labels, values }: KitchenKpisProps) {
  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {kpis.map((kpi) => {
        const Icon = kpi.icon;
        const TrendIcon = kpi.trendIcon;

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
                  {values[kpi.key]}
                </CardTitle>
              </div>
              <div className="rounded-2xl border border-border bg-muted/40 p-2">
                <Icon className={`size-4 ${kpi.accent}`} aria-hidden />
              </div>
            </CardHeader>
            <CardContent className="flex items-center justify-between gap-3">
              <Badge variant="outline" className={kpi.trendClass}>
                <TrendIcon className="size-3" aria-hidden />
                {labels[kpi.trend]}
              </Badge>
              <span className="h-7 w-20 rounded-full bg-linear-to-r from-primary/10 via-chart-2/20 to-chart-1/10" />
            </CardContent>
          </Card>
        );
      })}
    </section>
  );
}
