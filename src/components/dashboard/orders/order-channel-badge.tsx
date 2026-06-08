import { Globe2, MessageCircle, Store, Truck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { OrderChannel, OrdersLabels } from "./types";

type OrderChannelBadgeProps = {
  channel: OrderChannel;
  labels: OrdersLabels["channels"];
  whatsappLabel: string;
};

const channelClassName: Record<OrderChannel, string> = {
  whatsapp: "border-primary/30 bg-primary/10 text-primary",
  web: "border-border bg-muted/40 text-foreground",
  dineIn: "border-chart-4/30 bg-chart-4/10 text-chart-4",
  uberEats: "border-chart-2/30 bg-chart-2/10 text-chart-2",
  rappi: "border-chart-5/30 bg-chart-5/10 text-chart-5",
};

const channelIcons = {
  whatsapp: MessageCircle,
  web: Globe2,
  dineIn: Store,
  uberEats: Truck,
  rappi: Truck,
} satisfies Record<OrderChannel, React.ComponentType<{ className?: string }>>;

export function OrderChannelBadge({
  channel,
  labels,
  whatsappLabel,
}: OrderChannelBadgeProps) {
  const Icon = channelIcons[channel];

  return (
    <Badge
      variant="outline"
      aria-label={channel === "whatsapp" ? whatsappLabel : labels[channel]}
      className={cn("gap-1.5 whitespace-nowrap font-medium", channelClassName[channel])}
    >
      <Icon className="size-3.5" aria-hidden />
      {labels[channel]}
    </Badge>
  );
}
