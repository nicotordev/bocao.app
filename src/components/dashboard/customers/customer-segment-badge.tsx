import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { CustomerSegment } from "@/lib/customers/types";
import type { CustomerSegmentLabelMap } from "./types";

type CustomerSegmentBadgeProps = {
  segment: CustomerSegment;
  labels: CustomerSegmentLabelMap;
  className?: string;
};

const segmentClassName: Record<CustomerSegment, string> = {
  vip: "border-chart-1/30 bg-chart-1/10 text-chart-1",
  frequent: "border-primary/30 bg-primary/10 text-primary",
  new: "border-chart-4/30 bg-chart-4/10 text-chart-4",
  inactive: "border-muted-foreground/30 bg-muted/50 text-muted-foreground",
  at_risk: "border-destructive/30 bg-destructive/10 text-destructive",
  whatsapp: "border-primary/30 bg-primary/10 text-primary",
  high_value: "border-chart-2/30 bg-chart-2/10 text-chart-2",
};

export function CustomerSegmentBadge({
  segment,
  labels,
  className,
}: CustomerSegmentBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "whitespace-nowrap font-medium",
        segmentClassName[segment],
        className,
      )}
    >
      {labels[segment]}
    </Badge>
  );
}
