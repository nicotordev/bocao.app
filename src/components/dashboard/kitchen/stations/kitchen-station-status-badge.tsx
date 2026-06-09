import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { KitchenStationsLabels } from "./types";

type KitchenStationStatusBadgeProps = {
  isActive: boolean;
  labels: KitchenStationsLabels["status"];
  className?: string;
};

export function KitchenStationStatusBadge({
  isActive,
  labels,
  className,
}: KitchenStationStatusBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "whitespace-nowrap font-medium",
        isActive
          ? "border-chart-1/30 bg-chart-1/10 text-chart-1"
          : "border-border bg-muted/60 text-muted-foreground",
        className,
      )}
    >
      <span className="mr-1.5 size-1.5 rounded-full bg-current" />
      {isActive ? labels.active : labels.inactive}
    </Badge>
  );
}
