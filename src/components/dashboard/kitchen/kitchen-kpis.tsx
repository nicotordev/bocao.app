import {
  TbAlertTriangle,
  TbChefHat,
  TbClock,
  TbMinus,
  TbClipboardCheck,
  TbTrendingDown,
  TbTrendingUp,
} from "react-icons/tb";
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
    icon: TbClock,
    accent: "text-chart-4",
    trendClass: "border-primary/30 bg-primary/10 text-primary",
  },
  {
    key: "averageTime",
    icon: TbChefHat,
    accent: "text-chart-2",
    trendClass: "border-chart-2/30 bg-chart-2/10 text-chart-2",
  },
  {
    key: "delayed",
    icon: TbAlertTriangle,
    accent: "text-destructive",
    trendClass: "border-destructive/30 bg-destructive/10 text-destructive",
  },
  {
    key: "ready",
    icon: TbClipboardCheck,
    accent: "text-chart-1",
    trendClass: "border-chart-1/30 bg-chart-1/10 text-chart-1",
  },
] as const;

function resolveTrendIcon(trend: "up" | "down" | "neutral" | undefined) {
  if (trend === "down") {
    return TbTrendingDown;
  }

  if (trend === "up") {
    return TbTrendingUp;
  }

  return TbMinus;
}

export function KitchenKpis({ labels, values }: KitchenKpisProps) {
  return (
    <section className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
      {kpis.map((kpi) => {
        const Icon = kpi.icon;
        const trend = values.trends?.[kpi.key];
        const TrendIcon = resolveTrendIcon(trend?.trend);

        return (
          <Card key={kpi.key} size="sm" className="border-border/60 bg-card/80">
            <CardHeader className="grid grid-cols-[1fr_auto] items-center gap-2 py-3">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  {labels[kpi.key]}
                </p>
                <CardTitle className="mt-1 text-xl font-semibold">
                  {values[kpi.key]}
                </CardTitle>
              </div>
              <div className="rounded-xl border border-border bg-muted/40 p-1.5">
                <Icon className={`size-3.5 ${kpi.accent}`} aria-hidden />
              </div>
            </CardHeader>
            <CardContent className="pt-0 pb-3">
              <Badge variant="outline" className={kpi.trendClass}>
                <TrendIcon className="size-3" aria-hidden />
                {trend?.change ?? labels.notAvailable}
              </Badge>
            </CardContent>
          </Card>
        );
      })}
    </section>
  );
}
