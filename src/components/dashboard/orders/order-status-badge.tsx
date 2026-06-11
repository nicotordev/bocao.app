import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { OrderStatus, OrdersLabels } from "./types";

type OrderStatusBadgeProps = {
  status: OrderStatus;
  labels: OrdersLabels["statuses"];
};

const statusClassName: Record<OrderStatus, string> = {
  draft: "border-muted-foreground/30 bg-muted/50 text-muted-foreground",
  received: "border-secondary bg-secondary/60 text-secondary-foreground",
  confirmed: "border-chart-3/30 bg-chart-3/10 text-chart-3",
  preparing: "border-chart-2/30 bg-chart-2/10 text-chart-2",
  ready: "border-chart-1/30 bg-chart-1/10 text-chart-1",
  delivered: "border-primary/30 bg-primary/10 text-primary",
  cancelled: "border-destructive/30 bg-destructive/10 text-destructive",
};

export function OrderStatusBadge({ status, labels }: OrderStatusBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn("whitespace-nowrap font-medium", statusClassName[status])}
    >
      <span className="mr-1.5 size-1.5 rounded-full bg-current" />
      {labels[status]}
    </Badge>
  );
}
