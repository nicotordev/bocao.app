import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { KitchenOrderStatus } from "@/lib/kitchen/types";
import type { KitchenLabels } from "./types";

type KitchenStatusBadgeProps = {
  status: KitchenOrderStatus;
  labels: KitchenLabels["statuses"];
  completedLate?: boolean;
  className?: string;
};

const statusClassName: Record<KitchenOrderStatus, string> = {
  received: "border-secondary bg-secondary/60 text-secondary-foreground",
  in_preparation: "border-chart-2/30 bg-chart-2/10 text-chart-2",
  waiting: "border-border bg-muted/60 text-muted-foreground",
  ready: "border-chart-1/30 bg-chart-1/10 text-chart-1",
  delivered: "border-primary/30 bg-primary/10 text-primary",
  delayed: "border-destructive/30 bg-destructive/10 text-destructive",
};

export function KitchenStatusBadge({
  status,
  labels,
  completedLate = false,
  className,
}: KitchenStatusBadgeProps) {
  const lateDeliveredClassName =
    "border-warning/35 bg-warning/15 text-warning-foreground";

  return (
    <Badge
      variant="outline"
      className={cn(
        "whitespace-nowrap font-medium",
        completedLate && status === "delivered"
          ? lateDeliveredClassName
          : statusClassName[status],
        className,
      )}
    >
      <span className="mr-1.5 size-1.5 rounded-full bg-current" />
      {completedLate && status === "delivered"
        ? labels.deliveredLate
        : labels[status]}
    </Badge>
  );
}
