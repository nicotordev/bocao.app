import type { CustomerSegment } from "@/lib/customers/types";

const DAY_MS = 24 * 60 * 60 * 1000;

export const CUSTOMER_SEGMENT_THRESHOLDS = {
  newDays: 30,
  inactiveDays: 60,
  atRiskDays: 90,
  frequentOrdersIn90Days: 3,
  frequentOrdersIn30Days: 2,
  vipMinOrders: 8,
  vipSpendPercentile: 0.9,
  highValueMultiplier: 1.25,
  reservationFrequentCount: 3,
} as const;

export type CustomerMetricsInput = {
  createdAt: Date;
  orderCount: number;
  reservationCount: number;
  totalSpendCents: number;
  averageTicketCents: number;
  lastOrderAt: Date | null;
  lastReservationAt: Date | null;
  ordersLast30Days: number;
  ordersLast90Days: number;
  primaryChannel: string;
};

export type SegmentContext = {
  restaurantAverageTicketCents: number;
  spendPercentile90Cents: number;
};

function daysSince(date: Date | null, now: Date): number | null {
  if (!date) {
    return null;
  }

  return Math.floor((now.getTime() - date.getTime()) / DAY_MS);
}

function getLastActivityAt(input: CustomerMetricsInput): Date | null {
  const dates = [input.lastOrderAt, input.lastReservationAt].filter(
    (value): value is Date => value instanceof Date,
  );

  if (dates.length === 0) {
    return null;
  }

  return new Date(Math.max(...dates.map((date) => date.getTime())));
}

export function computeCustomerSegments(
  input: CustomerMetricsInput,
  context: SegmentContext,
  now = new Date(),
): CustomerSegment[] {
  const segments = new Set<CustomerSegment>();
  const createdDays = daysSince(input.createdAt, now);
  const lastActivityAt = getLastActivityAt(input);
  const inactiveDays = daysSince(lastActivityAt, now);

  if (createdDays !== null && createdDays <= CUSTOMER_SEGMENT_THRESHOLDS.newDays) {
    segments.add("new");
  }

  if (
    input.ordersLast90Days >= CUSTOMER_SEGMENT_THRESHOLDS.frequentOrdersIn90Days ||
    input.ordersLast30Days >= CUSTOMER_SEGMENT_THRESHOLDS.frequentOrdersIn30Days
  ) {
    segments.add("frequent");
  }

  if (
    input.orderCount >= CUSTOMER_SEGMENT_THRESHOLDS.vipMinOrders ||
    input.totalSpendCents >= context.spendPercentile90Cents
  ) {
    segments.add("vip");
  }

  if (
    context.restaurantAverageTicketCents > 0 &&
    input.averageTicketCents >=
      context.restaurantAverageTicketCents *
        CUSTOMER_SEGMENT_THRESHOLDS.highValueMultiplier
  ) {
    segments.add("high_value");
  }

  if (input.primaryChannel === "whatsapp") {
    segments.add("whatsapp");
  }

  if (
    inactiveDays !== null &&
    inactiveDays >= CUSTOMER_SEGMENT_THRESHOLDS.inactiveDays
  ) {
    segments.add("inactive");
  }

  if (
    input.orderCount > 0 &&
    inactiveDays !== null &&
    inactiveDays >= CUSTOMER_SEGMENT_THRESHOLDS.newDays &&
    inactiveDays < CUSTOMER_SEGMENT_THRESHOLDS.atRiskDays &&
    (input.ordersLast90Days > 0 || input.reservationCount > 0)
  ) {
    segments.add("at_risk");
  }

  if (segments.size === 0) {
    segments.add("new");
  }

  return [...segments];
}

const SEGMENT_PRIORITY: CustomerSegment[] = [
  "vip",
  "at_risk",
  "inactive",
  "frequent",
  "whatsapp",
  "high_value",
  "new",
];

export function getPrimarySegment(segments: CustomerSegment[]): CustomerSegment {
  for (const segment of SEGMENT_PRIORITY) {
    if (segments.includes(segment)) {
      return segment;
    }
  }

  return segments[0] ?? "new";
}

export function customerMatchesSegmentFilter(
  segments: CustomerSegment[],
  filter: CustomerSegment | "all",
): boolean {
  if (filter === "all") {
    return true;
  }

  return segments.includes(filter);
}

export function isReservationFrequentCustomer(
  reservationCount: number,
): boolean {
  return reservationCount >= CUSTOMER_SEGMENT_THRESHOLDS.reservationFrequentCount;
}
