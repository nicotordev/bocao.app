import Link from "next/link";
import { TbArrowDownRight, TbArrowRight, TbArrowUpRight, TbTrendingUp, TbReceipt, TbCalendar, TbClock } from "react-icons/tb";
import type { DashboardMetric } from "@/lib/dashboard/data";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

type MetricCardProps = {
  metric: DashboardMetric;
  viewLabel?: string;
};

const METRIC_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  "revenue-today": TbTrendingUp,
  "open-orders": TbReceipt,
  "upcoming-reservations": TbCalendar,
  "avg-prep-time": TbClock,
};

export function MetricCard({ metric, viewLabel }: MetricCardProps) {
  const TrendIcon =
    metric.trend === "down" ? TbArrowDownRight : TbArrowUpRight;

  const IconComponent = METRIC_ICONS[metric.id];

  const card = (
    <Card
      className={cn(
        "h-full border border-border/40 bg-card/65 dark:bg-card/45 backdrop-blur-md p-5 flex flex-col justify-between min-h-[145px] transition-all duration-300 relative overflow-hidden group/card",
        metric.href &&
          "hover:shadow-md hover:border-primary/25 hover:-translate-y-0.5 duration-200 cursor-pointer",
      )}
    >
      {/* Decorative soft glow inside card on hover */}
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-transparent to-primary/2 opacity-0 group-hover/card:opacity-100 transition-opacity duration-300 pointer-events-none" />

      <div className="flex items-start justify-between gap-4 relative z-10">
        <div className="space-y-1">
          <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
            {metric.label}
          </p>
          <p className="text-2xl font-bold tracking-tight text-foreground font-sans md:text-3xl mt-2">
            {metric.value}
          </p>
        </div>
        
        {IconComponent ? (
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted/60 text-muted-foreground group-hover/metric:bg-primary/10 group-hover/metric:text-primary transition-colors duration-300">
            <IconComponent className="size-4.5" aria-hidden />
          </span>
        ) : null}
      </div>

      <div className="mt-4 flex items-center justify-between gap-2 relative z-10">
        <Badge
          variant="outline"
          className={cn(
            "gap-1 font-medium text-xs px-2.5 py-0.5 rounded-full border",
            metric.trend === "up" &&
              "border-emerald-500/20 bg-emerald-500/8 text-emerald-600 dark:text-emerald-400 dark:bg-emerald-500/10",
            metric.trend === "down" &&
              "border-rose-500/20 bg-rose-500/8 text-rose-600 dark:text-rose-400 dark:bg-rose-500/10",
            metric.trend === "neutral" &&
              "border-muted bg-muted/10 text-muted-foreground",
          )}
        >
          {metric.trend !== "neutral" ? (
            <TrendIcon className="size-3" aria-hidden />
          ) : null}
          {metric.change}
        </Badge>

        {metric.href && viewLabel ? (
          <p className="flex items-center gap-0.5 text-xs font-semibold text-primary opacity-0 -translate-x-1 group-hover/metric:opacity-100 group-hover/metric:translate-x-0 group-focus-visible/metric:opacity-100 group-focus-visible/metric:translate-x-0 transition-all duration-300">
            {viewLabel}
            <TbArrowRight className="size-3.5" aria-hidden />
          </p>
        ) : null}
      </div>
    </Card>
  );

  if (!metric.href) {
    return card;
  }

  return (
    <Link
      href={metric.href}
      aria-label={`${metric.label}: ${metric.value}. ${viewLabel ?? ""}`}
      className="group/metric block rounded-3xl outline-none focus-visible:ring-3 focus-visible:ring-ring/30"
    >
      {card}
    </Link>
  );
}
