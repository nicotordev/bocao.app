import {
  CalendarDays,
  Globe2,
  MessageCircle,
  Store,
  Truck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { CustomerChannel } from "@/lib/customers/types";
import type { CustomersLabels } from "./types";

type CustomerChannelBadgeProps = {
  channel: CustomerChannel;
  labels: CustomersLabels["channels"];
  className?: string;
};

const channelClassName: Record<CustomerChannel, string> = {
  whatsapp: "border-primary/30 bg-primary/10 text-primary",
  web: "border-border bg-muted/40 text-foreground",
  in_person: "border-chart-4/30 bg-chart-4/10 text-chart-4",
  delivery: "border-chart-2/30 bg-chart-2/10 text-chart-2",
  reservation: "border-chart-5/30 bg-chart-5/10 text-chart-5",
};

const channelIcons = {
  whatsapp: MessageCircle,
  web: Globe2,
  in_person: Store,
  delivery: Truck,
  reservation: CalendarDays,
} satisfies Record<
  CustomerChannel,
  React.ComponentType<{ className?: string }>
>;

export function CustomerChannelBadge({
  channel,
  labels,
  className,
}: CustomerChannelBadgeProps) {
  const Icon = channelIcons[channel];

  return (
    <Badge
      variant="outline"
      className={cn("gap-1.5 whitespace-nowrap font-medium", channelClassName[channel], className)}
    >
      <Icon className="size-3.5" aria-hidden />
      {labels[channel]}
    </Badge>
  );
}
