import type { DashboardOrderPreview } from "@/lib/dashboard/data";
import type { Order } from "@/lib/orders/types";

export function mapOrderToDashboardPreview(
  order: Order,
  relativeMinutesTemplate: string,
): DashboardOrderPreview {
  const minutes = Math.max(1, order.waitMinutes);

  return {
    id: order.id,
    orderNumber: order.id,
    customerName: order.customerName,
    status: order.status,
    channel: order.channel,
    tableNumber: order.tableNumber,
    total: order.total,
    createdAt: relativeMinutesTemplate.replace("{minutes}", String(minutes)),
  };
}
