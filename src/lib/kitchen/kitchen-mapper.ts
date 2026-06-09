import type { Order as PrismaOrder, Customer } from "@/generated/prisma/client";
import {
  formatOrderCustomerLabel,
  getOrderCustomers,
  type OrderCustomerLabels,
} from "@/lib/orders/order-customers";
import { mapDbStatusToUi } from "@/lib/orders/order-mapper";
import type {
  KitchenChannel,
  KitchenOrder,
  KitchenOrderItem,
  KitchenOrderStatus,
  KitchenPriority,
  KitchenStation,
  KitchenTimelineEvent,
} from "@/lib/kitchen/types";

const DEFAULT_SLA_MINUTES = 20;

type KitchenDetailsJson = {
  station?: KitchenStation;
  priority?: KitchenPriority;
  slaMinutes?: number;
  isPaused?: boolean;
  importantNote?: string;
};

type OrderDetailsJson = {
  items?: Array<{
    name: string;
    quantity: number;
    price?: string;
    modifiers?: string[];
    allergens?: string[];
    notes?: string;
  }>;
  timeline?: Array<{
    time: string;
    titleKey: string;
    actor?: string;
    channel?: string;
  }>;
  kitchen?: KitchenDetailsJson;
};

const ORDER_TIMELINE_TO_KITCHEN: Record<
  string,
  KitchenTimelineEvent["titleKey"]
> = {
  eventReceived: "eventReceived",
  eventConfirmedAi: "eventAssigned",
  eventPreparing: "eventStarted",
  eventReady: "eventReady",
  eventDelivered: "eventDelivered",
  eventDelayed: "eventDelayed",
  eventAssigned: "eventAssigned",
  eventStarted: "eventStarted",
  eventPaused: "eventPaused",
};

const CHANNEL_TO_KITCHEN: Record<string, KitchenChannel> = {
  whatsapp: "whatsapp",
  web: "web",
  dineIn: "table",
  uberEats: "delivery",
  rappi: "delivery",
};

function parseDetails(details: unknown): OrderDetailsJson {
  if (!details || typeof details !== "object") {
    return {};
  }

  return details as OrderDetailsJson;
}

function resolveIntlLocale(locale?: string): string {
  return locale === "es" ? "es-CL" : "en-US";
}

function formatReceivedAt(
  date: Date,
  timezone: string,
  locale?: string,
): string {
  return new Intl.DateTimeFormat(resolveIntlLocale(locale), {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: timezone,
  }).format(date);
}

function getElapsedMinutes(createdAt: Date): number {
  return Math.max(0, Math.round((Date.now() - createdAt.getTime()) / 60_000));
}

function inferStation(items: KitchenOrderItem[]): KitchenStation {
  const haystack = items.map((item) => item.name.toLowerCase()).join(" ");

  if (/(sushi|sashimi|maki|edamame)/.test(haystack)) {
    return "sushi";
  }

  if (/(postre|dessert|cheesecake|torta|helado)/.test(haystack)) {
    return "desserts";
  }

  if (/(pisco|cocktail|bar|cerveza|vino)/.test(haystack)) {
    return "bar";
  }

  if (/(nugget|papas|aros|freid|frita)/.test(haystack)) {
    return "fryer";
  }

  return "grill";
}

function mapItems(details: OrderDetailsJson): KitchenOrderItem[] {
  return (details.items ?? []).map((item, index) => ({
    id: `item-${index + 1}`,
    quantity: item.quantity,
    name: item.name,
    modifiers: item.modifiers,
    allergens: item.allergens,
    notes: item.notes,
  }));
}

function mapTimeline(
  details: OrderDetailsJson,
  channel: KitchenChannel,
): KitchenTimelineEvent[] {
  return (details.timeline ?? []).map((event) => ({
    time: event.time,
    titleKey: ORDER_TIMELINE_TO_KITCHEN[event.titleKey] ?? "eventReceived",
    actor: event.actor,
    channel: (event.channel as KitchenChannel | undefined) ?? channel,
  }));
}

function resolvePriority(
  kitchen: KitchenDetailsJson,
  elapsedMinutes: number,
  slaMinutes: number,
): KitchenPriority {
  if (kitchen.priority) {
    return kitchen.priority;
  }

  if (elapsedMinutes > slaMinutes) {
    return "delayed";
  }

  if (elapsedMinutes > Math.round(slaMinutes * 0.75)) {
    return "high";
  }

  return "normal";
}

function resolveKitchenStatus(
  dbStatus: PrismaOrder["status"],
  kitchen: KitchenDetailsJson,
  elapsedMinutes: number,
  slaMinutes: number,
): KitchenOrderStatus {
  if (kitchen.priority === "delayed" || elapsedMinutes > slaMinutes) {
    if (dbStatus === "PREPARING" || dbStatus === "CONFIRMED") {
      return "delayed";
    }
  }

  if (kitchen.isPaused && dbStatus === "PREPARING") {
    return "waiting";
  }

  switch (dbStatus) {
    case "PENDING":
      return "received";
    case "CONFIRMED":
      return "received";
    case "PREPARING":
      return "in_preparation";
    case "READY":
      return "ready";
    case "COMPLETED":
      return "delivered";
    default:
      return "received";
  }
}

type MapKitchenOrderOptions = {
  timezone?: string;
  locale?: string;
  customerLabels?: OrderCustomerLabels;
};

export function mapDbOrderToKitchen(
  order: PrismaOrder & {
    customers?: Array<{ customer: Customer }>;
  },
  options: MapKitchenOrderOptions = {},
): KitchenOrder {
  const timezone = options.timezone ?? "America/Santiago";
  const details = parseDetails(order.details);
  const kitchen = details.kitchen ?? {};
  const items = mapItems(details);
  const channel = CHANNEL_TO_KITCHEN[order.channel ?? "web"] ?? "web";
  const slaMinutes = kitchen.slaMinutes ?? DEFAULT_SLA_MINUTES;
  const elapsedMinutes = getElapsedMinutes(order.createdAt);
  const customerLabel = formatOrderCustomerLabel({
    customers: getOrderCustomers(order),
    tableNumber: order.tableNumber,
    labels: options.customerLabels,
  });

  const status = resolveKitchenStatus(
    order.status,
    kitchen,
    elapsedMinutes,
    slaMinutes,
  );

  return {
    id: order.orderNumber,
    number: order.orderNumber,
    status,
    priority: resolvePriority(kitchen, elapsedMinutes, slaMinutes),
    channel,
    station: kitchen.station ?? inferStation(items),
    customerName:
      order.tableNumber == null ? customerLabel.customerName : undefined,
    tableNumber: order.tableNumber ?? undefined,
    elapsedMinutes,
    slaMinutes,
    receivedAt: formatReceivedAt(order.createdAt, timezone, options.locale),
    items,
    kitchenNotes: order.notes ?? undefined,
    importantNote: kitchen.importantNote,
    assignedTo: order.assignedTo ?? undefined,
    isPaused: kitchen.isPaused ?? false,
    timeline: mapTimeline(details, channel),
  };
}

export function mapKitchenStatusToDbStatus(
  status: KitchenOrderStatus,
): PrismaOrder["status"] {
  switch (status) {
    case "received":
      return "CONFIRMED";
    case "in_preparation":
    case "waiting":
    case "delayed":
      return "PREPARING";
    case "ready":
      return "READY";
    case "delivered":
      return "COMPLETED";
    default:
      return "PREPARING";
  }
}

export function mapKitchenStatusToKitchenDetails(
  status: KitchenOrderStatus,
  current: KitchenDetailsJson = {},
): KitchenDetailsJson {
  switch (status) {
    case "waiting":
      return {
        ...current,
        isPaused: true,
        priority: current.priority === "delayed" ? "delayed" : current.priority,
      };
    case "delayed":
      return {
        ...current,
        isPaused: false,
        priority: "delayed",
      };
    case "in_preparation":
      return {
        ...current,
        isPaused: false,
        priority: current.priority === "delayed" ? "delayed" : current.priority,
      };
    case "received":
      return {
        ...current,
        isPaused: false,
      };
    case "ready":
    case "delivered":
      return {
        ...current,
        isPaused: false,
      };
    default:
      return current;
  }
}

export function appendKitchenTimelineEvent(
  details: OrderDetailsJson,
  event: {
    titleKey: string;
    actor?: string;
    channel?: string;
  },
  timezone: string,
): OrderDetailsJson {
  const nowLabel = new Intl.DateTimeFormat("es-CL", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: timezone,
  }).format(new Date());

  return {
    ...details,
    timeline: [
      ...(details.timeline ?? []),
      {
        time: nowLabel,
        titleKey: event.titleKey,
        actor: event.actor,
        channel: event.channel,
      },
    ],
  };
}

export function kitchenStatusToTimelineKey(
  status: KitchenOrderStatus,
): string | null {
  switch (status) {
    case "in_preparation":
      return "eventPreparing";
    case "waiting":
      return "eventPaused";
    case "ready":
      return "eventReady";
    case "delivered":
      return "eventDelivered";
    case "delayed":
      return "eventDelayed";
    default:
      return null;
  }
}

export function parseOrderDetails(details: unknown): OrderDetailsJson {
  return parseDetails(details);
}
