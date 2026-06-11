import { formatCurrency } from "@/lib/orders/currency";
import { parseOrderDetailsJson } from "@/lib/orders/order-details-json";
import type { CreateOrderLineItemInput } from "@/lib/orders/types";
import type { OrderKind } from "@/lib/orders/order-kind";
import type { OrderTotals } from "@/lib/orders/compute-order-totals";

type BuildOrderDetailsInput = {
  items: CreateOrderLineItemInput[];
  totals: OrderTotals;
  currency: string;
  kind: OrderKind;
  history?: string;
  timelineNow?: string;
};

export function buildOrderDetailsPayload({
  items,
  totals,
  currency,
  kind,
  history = "Manual order",
  timelineNow = "Now",
}: BuildOrderDetailsInput) {
  const formattedItems = items.map((item) => ({
    menuItemId: item.menuItemId,
    name: item.name,
    quantity: item.quantity,
    priceCents: item.priceCents,
    price: formatCurrency(item.priceCents, currency),
    ...(item.imageUrls?.length ? { imageUrls: item.imageUrls } : {}),
    ...(item.customization ? { customization: item.customization } : {}),
  }));

  return {
    history,
    kind,
    items: formattedItems,
    summary: {
      subtotal: formatCurrency(totals.subtotalCents, currency),
      taxes: formatCurrency(totals.taxCents, currency),
      total: formatCurrency(totals.totalCents, currency),
    },
    timeline: [
      {
        time: timelineNow,
        titleKey: "eventReceived",
      },
    ],
  };
}

type StoredOrderLineItem = {
  menuItemId?: string;
  name: string;
  quantity: number;
  priceCents?: number;
  price?: string;
  imageUrls?: string[];
  customization?: CreateOrderLineItemInput["customization"];
};

export function parseStoredOrderLineItems(
  details: unknown,
): CreateOrderLineItemInput[] {
  const parsed = parseOrderDetailsJson<{ items?: StoredOrderLineItem[] }>(
    details,
  );
  const items = parsed.items;

  if (!Array.isArray(items)) {
    return [];
  }

  return items.map((item) => ({
    menuItemId: item.menuItemId,
    name: item.name,
    quantity: item.quantity,
    priceCents: item.priceCents ?? 0,
    imageUrls: item.imageUrls,
    customization: item.customization,
  }));
}
