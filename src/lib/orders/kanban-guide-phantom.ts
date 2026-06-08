import type { DashboardOrder } from "@/lib/orders/types";

export const KANBAN_GUIDE_PHANTOM_ORDER_ID = "__kanban-guide-phantom__";

export function isKanbanGuidePhantomOrder(orderId: string): boolean {
  return orderId === KANBAN_GUIDE_PHANTOM_ORDER_ID;
}

export type KanbanGuidePhantomLabels = {
  customerName: string;
  total: string;
  owner: string;
};

export function createKanbanGuidePhantomOrder(
  labels: KanbanGuidePhantomLabels,
): DashboardOrder {
  return {
    id: KANBAN_GUIDE_PHANTOM_ORDER_ID,
    customerName: labels.customerName,
    phone: "",
    channel: "web",
    status: "received",
    total: labels.total,
    createdAt: new Date().toISOString(),
    waitMinutes: 0,
    owner: labels.owner,
    history: "",
    notes: "",
    items: [],
    summary: {
      subtotal: labels.total,
      taxes: "$0",
      total: labels.total,
    },
    timeline: [],
  };
}
