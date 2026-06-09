import {
  ChefHat,
  Clock3,
  DollarSign,
  Minus,
  PackageCheck,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { OrdersKpiValues } from "@/lib/orders/compute-kpis";
import type { OrdersLabels } from "./types";

type OrdersKpisProps = {
  labels: OrdersLabels["kpis"];
  values: OrdersKpiValues;
};

const kpis = [
  {
    key: "active",
    icon: Clock3,
    accent: "text-chart-4",
  },
  {
    key: "preparing",
    icon: ChefHat,
    accent: "text-chart-2",
  },
  {
    key: "ready",
    icon: PackageCheck,
    accent: "text-chart-1",
  },
  {
    key: "sales",
    icon: DollarSign,
    accent: "text-primary",
  },
] as const;

function resolveTrendIcon(trend: "up" | "down" | "neutral" | undefined) {
  if (trend === "down") {
    return TrendingDown;
  }

  if (trend === "up") {
    return TrendingUp;
  }

  return Minus;
}

export function OrdersKpis({ labels, values }: OrdersKpisProps) {
  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {kpis.map((kpi) => {
        const Icon = kpi.icon;
        const trend = values.trends?.[kpi.key];
        const TrendIcon = resolveTrendIcon(trend?.trend);

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
              <Badge
                variant="outline"
                className="gap-1 border-primary/30 bg-primary/10 text-primary"
              >
                <TrendIcon className="size-3" aria-hidden />
                {trend?.change ?? labels.notAvailable}
              </Badge>
              <span className="h-7 w-20 rounded-full bg-linear-to-r from-primary/10 via-chart-2/20 to-chart-1/10" />
            </CardContent>
          </Card>
        );
      })}
    </section>
  );
}
