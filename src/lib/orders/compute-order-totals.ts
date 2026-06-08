export type OrderLineInput = {
  quantity: number;
  priceCents: number;
};

export type OrderTotals = {
  subtotalCents: number;
  taxCents: number;
  totalCents: number;
};

const TAX_RATE = 0.19;

export function computeOrderTotals(items: OrderLineInput[]): OrderTotals {
  const subtotalCents = items.reduce(
    (sum, item) => sum + item.quantity * item.priceCents,
    0,
  );
  const taxCents = Math.round(subtotalCents * TAX_RATE);
  const totalCents = subtotalCents + taxCents;

  return { subtotalCents, taxCents, totalCents };
}
