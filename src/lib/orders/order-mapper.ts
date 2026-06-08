import type { Order as PrismaOrder, Customer } from "@/generated/prisma/client";
import { formatDateInputValue } from "@/lib/orders/date";
import { formatCurrency } from "@/lib/orders/currency";
import {
  formatOrderCustomerLabel,
  getOrderCustomers,
} from "@/lib/orders/order-customers";
import type {
  Order,
  OrderChannel,
  OrderItem,
  OrderStatus,
  OrderTimelineEvent,
} from "@/lib/orders/types";

type PrismaOrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PREPARING"
  | "READY"
  | "COMPLETED"
  | "CANCELLED";

const STATUS_TO_UI: Record<PrismaOrderStatus, OrderStatus> = {
  PENDING: "received",
  CONFIRMED: "confirmed",
  PREPARING: "preparing",
  READY: "ready",
  COMPLETED: "delivered",
  CANCELLED: "cancelled",
};

const STATUS_TO_DB: Record<OrderStatus, PrismaOrderStatus> = {
  received: "PENDING",
  confirmed: "CONFIRMED",
  preparing: "PREPARING",
  ready: "READY",
  delivered: "COMPLETED",
  cancelled: "CANCELLED",
};

type OrderDetailsJson = {
  history?: string;
  items?: OrderItem[];
  summary?: Order["summary"];
  timeline?: OrderTimelineEvent[];
};

export function mapDbStatusToUi(status: PrismaOrderStatus): OrderStatus {
  return STATUS_TO_UI[status];
}

export function mapUiStatusToDb(status: OrderStatus): PrismaOrderStatus {
  return STATUS_TO_DB[status];
}

function formatCreatedAt(date: Date, timezone: string): string {
  return new Intl.DateTimeFormat("es-CL", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: timezone,
  }).format(date);
}

function getWaitMinutes(createdAt: Date): number {
  return Math.max(0, Math.round((Date.now() - createdAt.getTime()) / 60_000));
}

function parseDetails(details: unknown): OrderDetailsJson {
  if (!details || typeof details !== "object") {
    return {};
  }

  return details as OrderDetailsJson;
}

type MapOrderOptions = {
  currency?: string;
  timezone?: string;
};

export function mapDbOrderToUi(
  order: PrismaOrder & {
    customers?: Array<{ customer: Customer }>;
  },
  options: MapOrderOptions = {},
): Order {
  const currency = options.currency ?? "CLP";
  const timezone = options.timezone ?? "America/Santiago";
  const details = parseDetails(order.details);
  const summary = details.summary ?? {
    subtotal: formatCurrency(order.totalCents, currency),
    taxes: formatCurrency(0, currency),
    total: formatCurrency(order.totalCents, currency),
  };
  const linkedCustomers = getOrderCustomers(order);
  const customerLabel = formatOrderCustomerLabel({
    customers: linkedCustomers,
    tableNumber: order.tableNumber,
  });

  return {
    id: order.orderNumber,
    customerName: customerLabel.customerName,
    customerNames: customerLabel.customerNames,
    phone: customerLabel.phone,
    tableNumber: order.tableNumber ?? undefined,
    channel: (order.channel ?? "web") as OrderChannel,
    status: mapDbStatusToUi(order.status),
    total: formatCurrency(order.totalCents, currency),
    totalCents: order.totalCents,
    createdAt: formatCreatedAt(order.createdAt, timezone),
    createdAtDate: formatDateInputValue(order.createdAt, timezone),
    waitMinutes: order.preparationMins ?? getWaitMinutes(order.createdAt),
    owner: order.assignedTo ?? "",
    history: details.history ?? "",
    notes: order.notes ?? "",
    items: details.items ?? [],
    summary,
    timeline: details.timeline ?? [],
  };
}
