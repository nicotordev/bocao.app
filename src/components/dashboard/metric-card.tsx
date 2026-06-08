import { TbArrowDownRight, TbArrowUpRight } from "react-icons/tb";
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
};

export function MetricCard({ metric }: MetricCardProps) {
  const TrendIcon =
    metric.trend === "down" ? TbArrowDownRight : TbArrowUpRight;

  return (
    <Card className="border-border/60 bg-card/80 backdrop-blur-sm">
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
      </CardContent>
    </Card>
  );
}

