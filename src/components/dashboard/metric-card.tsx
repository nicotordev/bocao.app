import Link from "next/link";
import { TbArrowDownRight, TbArrowRight, TbArrowUpRight } from "react-icons/tb";
import type { DashboardMetric } from "@/lib/dashboard/data";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type MetricCardProps = {
  metric: DashboardMetric;
  viewLabel?: string;
};

export function MetricCard({ metric, viewLabel }: MetricCardProps) {
  const TrendIcon =
    metric.trend === "down" ? TbArrowDownRight : TbArrowUpRight;

  const card = (
    <Card
      className={cn(
        "h-full border-border/60 bg-card/80 backdrop-blur-sm",
        metric.href &&
          "transition-colors hover:border-primary/30 hover:bg-card group-hover/metric:border-primary/30 group-hover/metric:bg-card",
      )}
    >
      <CardHeader className="pb-2">
        <CardDescription>{metric.label}</CardDescription>
        <CardTitle className="text-2xl font-semibold tracking-tight">
          {metric.value}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Badge
          variant="outline"
          className={cn(
            "gap-1 font-normal",
            metric.trend === "up" &&
              "border-primary/30 bg-primary/10 text-primary",
            metric.trend === "down" &&
              "border-destructive/30 bg-destructive/10 text-destructive",
            metric.trend === "neutral" && "text-muted-foreground",
          )}
        >
          {metric.trend !== "neutral" ? (
            <TrendIcon className="size-3" aria-hidden />
          ) : null}
          {metric.change}
        </Badge>
        {metric.href && viewLabel ? (
          <p className="mt-3 flex items-center gap-1 text-xs font-medium text-primary opacity-0 transition-opacity group-hover/metric:opacity-100 group-focus-visible/metric:opacity-100">
            {viewLabel}
            <TbArrowRight className="size-3.5" aria-hidden />
          </p>
        ) : null}
      </CardContent>
    </Card>
  );

  if (!metric.href) {
    return card;
  }

  return (
    <Link
      href={metric.href}
      aria-label={`${metric.label}: ${metric.value}. ${viewLabel ?? ""}`}
      className="group/metric block rounded-4xl outline-none focus-visible:ring-3 focus-visible:ring-ring/30"
    >
      {card}
    </Link>
  );
}
