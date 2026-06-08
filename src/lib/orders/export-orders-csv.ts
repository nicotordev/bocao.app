import { isKanbanGuidePhantomOrder } from "@/lib/orders/kanban-guide-phantom";
import type { Order, OrderChannel, OrderStatus } from "@/lib/orders/types";

export type OrdersCsvLabels = {
  columns: {
    id: string;
    customer: string;
    phone: string;
    channel: string;
    status: string;
    total: string;
    time: string;
    wait: string;
    owner: string;
    items: string;
    notes: string;
    table: string;
  };
  statuses: Record<OrderStatus, string>;
  channels: Record<OrderChannel, string>;
  minutes: string;
};

function escapeCsvField(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }

  return value;
}

function formatItemsForCsv(items: Order["items"]): string {
  return items.map((item) => `${item.quantity}x ${item.name}`).join("; ");
}

export function buildOrdersCsv(
  orders: readonly Order[],
  labels: OrdersCsvLabels,
): string {
  const exportableOrders = orders.filter(
    (order) => !isKanbanGuidePhantomOrder(order.id),
  );

  const header = [
    labels.columns.id,
    labels.columns.customer,
    labels.columns.phone,
    labels.columns.table,
    labels.columns.channel,
    labels.columns.status,
    labels.columns.total,
    labels.columns.time,
    labels.columns.wait,
    labels.columns.owner,
    labels.columns.items,
    labels.columns.notes,
  ]
    .map(escapeCsvField)
    .join(",");

  const rows = exportableOrders.map((order) =>
    [
      order.id,
      order.customerName,
      order.phone,
      order.tableNumber ?? "",
      labels.channels[order.channel],
      labels.statuses[order.status],
      order.total,
      order.createdAt,
      `${order.waitMinutes} ${labels.minutes}`,
      order.owner,
      formatItemsForCsv(order.items),
      order.notes,
    ]
      .map((value) => escapeCsvField(String(value)))
      .join(","),
  );

  return [header, ...rows].join("\r\n");
}

export function downloadCsvFile(filename: string, content: string): void {
  const blob = new Blob([`\uFEFF${content}`], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function buildOrdersCsvFilename(date = new Date()): string {
  const stamp = date.toISOString().slice(0, 10);
  return `orders-${stamp}.csv`;
}
