import { ChefHat, Clock3, DollarSign, PackageCheck, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { OrdersLabels } from "./types";

type OrdersKpisProps = {
  labels: OrdersLabels["kpis"];
};

const kpis = [
  {
    key: "active",
    value: "42",
    icon: Clock3,
    trend: "activeTrend",
    accent: "text-chart-4",
  },
  {
    key: "preparing",
    value: "18",
    icon: ChefHat,
    trend: "preparingTrend",
    accent: "text-chart-2",
  },
  {
    key: "ready",
    value: "11",
    icon: PackageCheck,
    trend: "readyTrend",
    accent: "text-chart-1",
  },
  {
    key: "sales",
    value: "$1.240.000",
    icon: DollarSign,
    trend: "salesTrend",
    accent: "text-primary",
  },
] as const;

export function OrdersKpis({ labels }: OrdersKpisProps) {
  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {kpis.map((kpi) => {
        const Icon = kpi.icon;

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
                  {kpi.value}
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
                <TrendingUp className="size-3" aria-hidden />
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
