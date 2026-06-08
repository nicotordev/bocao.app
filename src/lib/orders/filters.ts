import type { Order, OrderChannel, OrderStatus } from "@/lib/orders/types";

export type OrdersListFilters = {
  search?: string;
  status?: OrderStatus | "all";
  channel?: OrderChannel | "all";
  from?: string;
  to?: string;
};

export function applyOrdersListFilters(
  orders: readonly Order[],
  filters?: OrdersListFilters,
): Order[] {
  const search = filters?.search?.trim().toLowerCase() ?? "";

  return orders.filter((order) => {
    const matchesSearch =
      search.length === 0 ||
      order.id.toLowerCase().includes(search) ||
      order.customerName.toLowerCase().includes(search) ||
      order.customerNames.some((name) => name.toLowerCase().includes(search)) ||
      (order.tableNumber?.toLowerCase().includes(search) ?? false) ||
      order.phone.toLowerCase().includes(search);
    const matchesStatus =
      !filters?.status ||
      filters.status === "all" ||
      order.status === filters.status;
    const matchesChannel =
      !filters?.channel ||
      filters.channel === "all" ||
      order.channel === filters.channel;
    const matchesFrom =
      !filters?.from || order.createdAtDate >= filters.from;
    const matchesTo = !filters?.to || order.createdAtDate <= filters.to;

    return (
      matchesSearch &&
      matchesStatus &&
      matchesChannel &&
      matchesFrom &&
      matchesTo
    );
  });
}
