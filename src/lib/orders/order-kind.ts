import type { OrderType } from "@/generated/prisma/client";
import type { OrderChannel } from "@/lib/orders/types";

export type OrderKind = "dineIn" | "takeout" | "delivery" | "whatsapp" | "pos";

type ResolvedOrderKind = {
  type: OrderType;
  channel: OrderChannel;
};

const ORDER_KIND_MAP: Record<OrderKind, ResolvedOrderKind> = {
  dineIn: { type: "DINE_IN", channel: "dineIn" },
  takeout: { type: "TAKEOUT", channel: "pos" },
  delivery: { type: "DELIVERY", channel: "pos" },
  whatsapp: { type: "TAKEOUT", channel: "whatsapp" },
  pos: { type: "TAKEOUT", channel: "pos" },
};

export function resolveOrderKind(
  kind: OrderKind,
  tableNumber?: string,
): ResolvedOrderKind {
  if (kind === "pos" && tableNumber?.trim()) {
    return { type: "DINE_IN", channel: "pos" };
  }

  return ORDER_KIND_MAP[kind];
}

export const ORDER_KINDS: OrderKind[] = [
  "dineIn",
  "takeout",
  "delivery",
  "whatsapp",
  "pos",
];
