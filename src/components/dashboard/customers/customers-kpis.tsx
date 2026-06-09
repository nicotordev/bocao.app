import {
  DollarSign,
  Minus,
  TrendingDown,
  TrendingUp,
  UserCheck,
  UserMinus,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CustomersKpiValues } from "@/lib/customers/types";
import type { CustomersLabels } from "./types";

type CustomersKpisProps = {
  labels: CustomersLabels["kpis"];
  values: CustomersKpiValues;
};

const kpis = [
  {
    key: "total",
    icon: Users,
    accent: "text-primary",
    trendClass: "border-primary/30 bg-primary/10 text-primary",
  },
  {
    key: "frequent",
    icon: UserCheck,
    accent: "text-chart-1",
    trendClass: "border-chart-1/30 bg-chart-1/10 text-chart-1",
  },
  {
    key: "averageTicket",
    icon: DollarSign,
    accent: "text-chart-2",
    trendClass: "border-chart-2/30 bg-chart-2/10 text-chart-2",
  },
  {
    key: "inactive",
    icon: UserMinus,
    accent: "text-destructive",
    trendClass: "border-destructive/30 bg-destructive/10 text-destructive",
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

export function CustomersKpis({ labels, values }: CustomersKpisProps) {
  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {kpis.map((kpi) => {
        const Icon = kpi.icon;
        const trend = values.trends[kpi.key];
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
            <CardContent>
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
