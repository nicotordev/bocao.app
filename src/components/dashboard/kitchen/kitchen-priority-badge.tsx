import { AlertTriangle, ArrowDown, Flame, Timer } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { KitchenPriority } from "@/lib/kitchen/types";
import type { KitchenLabels } from "./types";

type KitchenPriorityBadgeProps = {
  priority: KitchenPriority;
  labels: KitchenLabels["priorities"];
  className?: string;
};

const priorityConfig: Record<
  KitchenPriority,
  { icon: typeof Timer; className: string }
> = {
  normal: {
    icon: ArrowDown,
    className: "border-border bg-muted/40 text-muted-foreground",
  },
  high: {
    icon: Timer,
    className: "border-chart-3/30 bg-chart-3/10 text-chart-3",
  },
  urgent: {
    icon: Flame,
    className: "border-destructive/30 bg-destructive/10 text-destructive",
  },
  delayed: {
    icon: AlertTriangle,
    className: "border-destructive/40 bg-destructive/15 text-destructive",
  },
};

export function KitchenPriorityBadge({
  priority,
  labels,
  className,
}: KitchenPriorityBadgeProps) {
  const config = priorityConfig[priority];
  const Icon = config.icon;

  return (
    <Badge
      variant="outline"
      className={cn("gap-1 whitespace-nowrap font-medium", config.className, className)}
    >
      <Icon className="size-3" aria-hidden />
      {labels[priority]}
    </Badge>
  );
}
