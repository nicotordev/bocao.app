import {
  TbAlertTriangle,
  TbArrowDown,
  TbFlame,
  TbClock,
} from "react-icons/tb";
import type { IconType } from "react-icons";
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
  { icon: IconType; className: string }
> = {
  normal: {
    icon: TbArrowDown,
    className: "border-border bg-muted/40 text-muted-foreground",
  },
  high: {
    icon: TbClock,
    className: "border-chart-3/30 bg-chart-3/10 text-chart-3",
  },
  urgent: {
    icon: TbFlame,
    className: "border-destructive/30 bg-destructive/10 text-destructive",
  },
  delayed: {
    icon: TbAlertTriangle,
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
