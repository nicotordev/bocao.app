import Link from "next/link";
import { TbArmchair } from "react-icons/tb";
import { OrderChannelBadge } from "@/components/dashboard/orders/order-channel-badge";
import { OrderStatusBadge } from "@/components/dashboard/orders/order-status-badge";
import type { OrdersLabels } from "@/components/dashboard/orders/types";
import type { DashboardOrderPreview } from "@/lib/dashboard/data";
import { cn } from "@/lib/utils";

export type RecentOrderItemLabels = {
  viewOrder: string;
  table: string;
  statuses: OrdersLabels["statuses"];
  channels: OrdersLabels["channels"];
  whatsappOrder: string;
};

type RecentOrderItemProps = {
  order: DashboardOrderPreview;
  labels: RecentOrderItemLabels;
};

export function RecentOrderItem({ order, labels }: RecentOrderItemProps) {
  return (
    <li>
      <Link
        href={`/dashboard/orders?orderId=${encodeURIComponent(order.orderNumber)}`}
        aria-label={labels.viewOrder.replace("{id}", order.orderNumber)}
        className={cn(
          "flex items-center justify-between gap-3 rounded-2xl border border-border/50 bg-muted/20 px-4 py-3 transition-colors",
          "hover:border-border hover:bg-muted/35",
        )}
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-sm font-medium">{order.orderNumber}</p>
            <OrderChannelBadge
              channel={order.channel}
              labels={labels.channels}
              whatsappLabel={labels.whatsappOrder}
            />
          </div>
          <p className="truncate text-sm text-muted-foreground">
            {order.customerName}
          </p>
          {order.tableNumber ? (
            <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
              <TbArmchair className="size-3.5 shrink-0" aria-hidden />
              {labels.table.replace("{number}", order.tableNumber)}
            </p>
          ) : null}
          <p className="mt-1 text-xs text-muted-foreground">
            {order.createdAt}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <span className="text-sm font-medium">{order.total}</span>
          <OrderStatusBadge status={order.status} labels={labels.statuses} />
        </div>
      </Link>
    </li>
  );
}
