import type {
  Order as PrismaOrder,
  Customer,
  Payment as PrismaPayment,
} from "@/generated/prisma/client";
import { mapDbPaymentToUi } from "@/lib/payments/mapper";
import type { OrderKind } from "@/lib/orders/order-kind";
import {
  elapsedMinutesSince,
  formatDateInputValue,
  formatTimeInTimezone,
} from "@/lib/orders/date";
import { parseOrderDetailsJson } from "@/lib/orders/order-details-json";
import { formatCurrency } from "@/lib/orders/currency";
import {
  formatOrderCustomerLabel,
  getOrderCustomers,
  type OrderCustomerLabels,
} from "@/lib/orders/order-customers";
import type {
  Order,
  OrderChannel,
  OrderItem,
  OrderStatus,
  OrderTimelineEvent,
} from "@/lib/orders/types";

type PrismaOrderStatus =
  | "DRAFT"
  | "PENDING"
  | "CONFIRMED"
  | "PREPARING"
  | "READY"
  | "COMPLETED"
  | "CANCELLED";

const STATUS_TO_UI: Record<PrismaOrderStatus, OrderStatus> = {
  DRAFT: "draft",
  PENDING: "received",
  CONFIRMED: "confirmed",
  PREPARING: "preparing",
  READY: "ready",
  COMPLETED: "delivered",
  CANCELLED: "cancelled",
};

const STATUS_TO_DB: Record<OrderStatus, PrismaOrderStatus> = {
  draft: "DRAFT",
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
  kind?: OrderKind;
};

export function mapDbStatusToUi(status: PrismaOrderStatus): OrderStatus {
  return STATUS_TO_UI[status];
}

export function mapUiStatusToDb(status: OrderStatus): PrismaOrderStatus {
  return STATUS_TO_DB[status];
}

type MapOrderOptions = {
  currency?: string;
  timezone?: string;
  locale?: string;
  customerLabels?: OrderCustomerLabels;
};

function resolvePrimaryPayment(
  payments?: PrismaPayment[],
): Order["payment"] | undefined {
  if (!payments?.length) {
    return undefined;
  }

  return mapDbPaymentToUi(payments[0]!);
}

export function mapDbOrderToUi(
  order: PrismaOrder & {
    customers?: Array<{ customer: Customer }>;
    payments?: PrismaPayment[];
  },
  options: MapOrderOptions = {},
): Order {
  const currency = options.currency ?? "CLP";
  const timezone = options.timezone ?? "America/Santiago";
  const details = parseOrderDetailsJson<OrderDetailsJson>(order.details);
  const summary = details.summary ?? {
    subtotal: formatCurrency(order.totalCents, currency),
    taxes: formatCurrency(0, currency),
    total: formatCurrency(order.totalCents, currency),
  };
  const linkedCustomers = getOrderCustomers(order);
  const customerLabel = formatOrderCustomerLabel({
    customers: linkedCustomers,
    tableNumber: order.tableNumber,
    labels: options.customerLabels,
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
    createdAt: formatTimeInTimezone(order.createdAt, timezone, options.locale),
    createdAtDate: formatDateInputValue(order.createdAt, timezone),
    waitMinutes: order.preparationMins ?? elapsedMinutesSince(order.createdAt),
    owner: order.assignedTo ?? "",
    history: details.history ?? "",
    notes: order.notes ?? "",
    items: details.items ?? [],
    summary,
    timeline: details.timeline ?? [],
    payment: resolvePrimaryPayment(order.payments),
    kind: details.kind,
  };
}
