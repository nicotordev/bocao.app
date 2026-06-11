import { formatCurrency } from "@/lib/orders/currency";
import type { Order } from "@/lib/orders/types";

export type OrdersKpiTrend = {
  change: string;
  trend: "up" | "down" | "neutral";
};

export type OrdersKpiValues = {
  active: string;
  preparing: string;
  ready: string;
  sales: string;
  trends?: {
    active?: OrdersKpiTrend;
    preparing?: OrdersKpiTrend;
    ready?: OrdersKpiTrend;
    sales?: OrdersKpiTrend;
  };
};

export function computeOrdersKpis(
  orders: Order[],
  currency = "CLP",
): OrdersKpiValues {
  const activeOrders = orders.filter(
    (order) => !["delivered", "cancelled"].includes(order.status),
  );

  const salesCents = orders
    .filter((order) => order.status === "delivered")
    .reduce((sum, order) => sum + (order.totalCents ?? 0), 0);

  return {
    active: String(activeOrders.length),
    preparing: String(
      activeOrders.filter((order) => order.status === "preparing").length,
    ),
    ready: String(
      activeOrders.filter((order) => order.status === "ready").length,
    ),
    sales: formatCurrency(salesCents, currency),
  };
}
