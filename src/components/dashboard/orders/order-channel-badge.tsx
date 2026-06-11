import {
  TbWorld,
  TbMessageCircle,
  TbBuildingStore,
  TbTruck,
  TbCashRegister,
} from "react-icons/tb";
import type { IconType } from "react-icons";
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
  pos: "border-chart-3/30 bg-chart-3/10 text-chart-3",
};

const channelIcons = {
  whatsapp: TbMessageCircle,
  web: TbWorld,
  dineIn: TbBuildingStore,
  uberEats: TbTruck,
  rappi: TbTruck,
  pos: TbCashRegister,
} satisfies Record<OrderChannel, IconType>;

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
      className={cn(
        "gap-1.5 whitespace-nowrap font-medium",
        channelClassName[channel],
      )}
    >
      <Icon className="size-3.5" aria-hidden />
      {labels[channel]}
    </Badge>
  );
}
