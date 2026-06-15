import type { CustomerListItem } from "@/lib/customers/types";

const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_CUSTOMERS_IN_PROMPT = 150;

export type CustomerSmartSegmentPromptRow = {
  id: string;
  orderCount: number;
  reservationCount: number;
  totalSpendCents: number;
  averageTicketCents: number;
  lastVisitDaysAgo: number | null;
  createdDaysAgo: number;
  primaryChannel: string;
  segments: string[];
  tags: string[];
};

function daysSince(date: string | null, now: Date): number | null {
  if (!date) {
    return null;
  }

  return Math.floor((now.getTime() - new Date(date).getTime()) / DAY_MS);
}

export function buildCustomerSmartSegmentPromptRows(
  customers: CustomerListItem[],
  now = new Date(),
): CustomerSmartSegmentPromptRow[] {
  const ranked = [...customers].sort(
    (left, right) => right.totalSpendCents - left.totalSpendCents,
  );

  return ranked.slice(0, MAX_CUSTOMERS_IN_PROMPT).map((customer) => ({
    id: customer.id,
    orderCount: customer.orderCount,
    reservationCount: customer.reservationCount,
    totalSpendCents: customer.totalSpendCents,
    averageTicketCents: customer.averageTicketCents,
    lastVisitDaysAgo: daysSince(customer.lastVisitAt, now),
    createdDaysAgo: daysSince(customer.createdAt, now) ?? 0,
    primaryChannel: customer.primaryChannel,
    segments: customer.segments,
    tags: customer.tags.map((tag) => tag.name),
  }));
}
