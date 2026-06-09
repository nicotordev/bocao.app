import type {
  Customer,
  Order,
  Reservation,
} from "@/generated/prisma/client";
import {
  mapOrderToCustomerChannel,
  resolvePrimaryChannel,
} from "@/lib/customers/channel";
import {
  formatCustomerDate,
  formatMoney,
  formatRelativeDate,
  getCustomerInitials,
} from "@/lib/customers/format";
import {
  computeCustomerSegments,
  getPrimarySegment,
  type CustomerMetricsInput,
  type SegmentContext,
} from "@/lib/customers/segments";
import {
  parseCustomerAllergies,
  parseCustomerTags,
  stripCustomerTags,
} from "@/lib/customers/tags";
import type {
  CustomerActivityEvent,
  CustomerChannel,
  CustomerDetail,
  CustomerListItem,
  CustomerOrderSummary,
  CustomerReservationSummary,
} from "@/lib/customers/types";

type OrderLink = {
  order: Pick<
    Order,
    | "id"
    | "orderNumber"
    | "totalCents"
    | "channel"
    | "type"
    | "createdAt"
    | "status"
    | "details"
  >;
};

type CustomerRecord = Pick<
  Customer,
  | "id"
  | "name"
  | "email"
  | "phone"
  | "notes"
  | "avatar"
  | "createdAt"
  | "updatedAt"
> & {
  orderLinks: OrderLink[];
  reservations: Pick<
    Reservation,
    "id" | "guestCount" | "status" | "scheduledAt" | "createdAt"
  >[];
};

type OrderDetailsJson = {
  items?: Array<{ name?: string; quantity?: number }>;
};

const DAY_MS = 24 * 60 * 60 * 1000;

function parseOrderItems(details: unknown): string[] {
  if (!details || typeof details !== "object") {
    return [];
  }

  const items = (details as OrderDetailsJson).items;

  if (!Array.isArray(items)) {
    return [];
  }

  return items
    .map((item) => item.name?.trim())
    .filter((name): name is string => Boolean(name));
}

function countOrdersSince(orders: OrderLink[], since: Date): number {
  return orders.filter((link) => link.order.createdAt >= since).length;
}

function buildFrequencyLabel(orderCount: number, reservationCount: number): string {
  const totalVisits = orderCount + reservationCount;

  if (totalVisits >= 10) {
    return "high";
  }

  if (totalVisits >= 4) {
    return "medium";
  }

  if (totalVisits >= 1) {
    return "low";
  }

  return "none";
}

function mapOrderSummary(
  order: OrderLink["order"],
  currency: string,
  timezone: string,
  locale: string,
  neverLabel: string,
): CustomerOrderSummary {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    totalCents: order.totalCents,
    total: formatMoney(order.totalCents, currency),
    channel: mapOrderToCustomerChannel(order.channel, order.type),
    createdAt: formatCustomerDate(order.createdAt, timezone, locale),
    createdAtRelative: formatRelativeDate(order.createdAt, locale, neverLabel),
    status: order.status,
    itemNames: parseOrderItems(order.details),
  };
}

function mapReservationSummary(
  reservation: CustomerRecord["reservations"][number],
  timezone: string,
  locale: string,
  neverLabel: string,
): CustomerReservationSummary {
  return {
    id: reservation.id,
    guestCount: reservation.guestCount,
    status: reservation.status,
    scheduledAt: formatCustomerDate(reservation.scheduledAt, timezone, locale),
    scheduledAtRelative: formatRelativeDate(
      reservation.scheduledAt,
      locale,
      neverLabel,
    ),
  };
}

function buildMetricsInput(
  record: CustomerRecord,
  channelCounts: Partial<Record<CustomerChannel, number>>,
  primaryChannel: CustomerChannel,
  now: Date,
): CustomerMetricsInput {
  const orders = record.orderLinks.map((link) => link.order);
  const lastOrderAt =
    orders.length > 0
      ? new Date(Math.max(...orders.map((order) => order.createdAt.getTime())))
      : null;
  const lastReservationAt =
    record.reservations.length > 0
      ? new Date(
          Math.max(
            ...record.reservations.map((reservation) =>
              reservation.scheduledAt.getTime(),
            ),
          ),
        )
      : null;
  const thirtyDaysAgo = new Date(now.getTime() - 30 * DAY_MS);
  const ninetyDaysAgo = new Date(now.getTime() - 90 * DAY_MS);
  const totalSpendCents = orders.reduce(
    (sum, order) => sum + order.totalCents,
    0,
  );
  const orderCount = orders.length;

  return {
    createdAt: record.createdAt,
    orderCount,
    reservationCount: record.reservations.length,
    totalSpendCents,
    averageTicketCents:
      orderCount > 0 ? Math.round(totalSpendCents / orderCount) : 0,
    lastOrderAt,
    lastReservationAt,
    ordersLast30Days: countOrdersSince(record.orderLinks, thirtyDaysAgo),
    ordersLast90Days: countOrdersSince(record.orderLinks, ninetyDaysAgo),
    primaryChannel,
  };
}

function buildFavoriteDishes(orders: OrderLink[]): string[] {
  const counts = new Map<string, number>();

  for (const link of orders) {
    for (const itemName of parseOrderItems(link.order.details)) {
      counts.set(itemName, (counts.get(itemName) ?? 0) + 1);
    }
  }

  return [...counts.entries()]
    .sort((left, right) => right[1] - left[1])
    .slice(0, 3)
    .map(([name]) => name);
}

export function mapCustomerRecord(
  record: CustomerRecord,
  context: SegmentContext,
  options: {
    currency: string;
    timezone: string;
    locale: string;
    neverLabel: string;
    now?: Date;
  },
): CustomerListItem {
  const now = options.now ?? new Date();
  const channelCounts: Partial<Record<CustomerChannel, number>> = {};

  for (const link of record.orderLinks) {
    const channel = mapOrderToCustomerChannel(
      link.order.channel,
      link.order.type,
    );
    channelCounts[channel] = (channelCounts[channel] ?? 0) + 1;
  }

  const primaryChannel = resolvePrimaryChannel(
    channelCounts,
    record.reservations.length > 0,
  );
  const metrics = buildMetricsInput(record, channelCounts, primaryChannel, now);
  const segments = computeCustomerSegments(metrics, context, now);
  const lastActivityAt = metrics.lastOrderAt ?? metrics.lastReservationAt;

  return {
    id: record.id,
    name: record.name,
    email: record.email,
    phone: record.phone,
    avatar: record.avatar,
    initials: getCustomerInitials(record.name),
    segment: getPrimarySegment(segments),
    segments,
    tags: parseCustomerTags(record.notes),
    orderCount: metrics.orderCount,
    reservationCount: metrics.reservationCount,
    totalSpendCents: metrics.totalSpendCents,
    totalSpend: formatMoney(metrics.totalSpendCents, options.currency),
    averageTicketCents: metrics.averageTicketCents,
    averageTicket: formatMoney(metrics.averageTicketCents, options.currency),
    lastVisitAt: lastActivityAt?.toISOString() ?? null,
    lastVisitRelative: formatRelativeDate(
      lastActivityAt,
      options.locale,
      options.neverLabel,
    ),
    primaryChannel,
    createdAt: record.createdAt.toISOString(),
    createdAtRelative: formatRelativeDate(
      record.createdAt,
      options.locale,
      options.neverLabel,
    ),
    favoriteDishes: buildFavoriteDishes(record.orderLinks),
    notes: stripCustomerTags(record.notes),
    allergies: parseCustomerAllergies(record.notes),
    frequencyLabel: buildFrequencyLabel(
      metrics.orderCount,
      metrics.reservationCount,
    ),
  };
}

export function mapCustomerDetail(
  record: CustomerRecord,
  context: SegmentContext,
  options: {
    currency: string;
    timezone: string;
    locale: string;
    neverLabel: string;
    activity?: CustomerActivityEvent[];
    now?: Date;
  },
): CustomerDetail {
  const base = mapCustomerRecord(record, context, options);

  return {
    ...base,
    orders: record.orderLinks
      .map((link) =>
        mapOrderSummary(
          link.order,
          options.currency,
          options.timezone,
          options.locale,
          options.neverLabel,
        ),
      )
      .sort(
        (left, right) =>
          new Date(right.createdAt).getTime() -
          new Date(left.createdAt).getTime(),
      ),
    reservations: record.reservations
      .map((reservation) =>
        mapReservationSummary(
          reservation,
          options.timezone,
          options.locale,
          options.neverLabel,
        ),
      )
      .sort(
        (left, right) =>
          new Date(right.scheduledAt).getTime() -
          new Date(left.scheduledAt).getTime(),
      ),
    activity: options.activity ?? [],
  };
}

export function buildSegmentContext(
  customers: CustomerListItem[],
): SegmentContext {
  const spendValues = customers
    .map((customer) => customer.totalSpendCents)
    .filter((value) => value > 0)
    .sort((left, right) => left - right);

  const ticketValues = customers
    .filter((customer) => customer.orderCount > 0)
    .map((customer) => customer.averageTicketCents);

  const spendPercentile90Cents =
    spendValues.length > 0
      ? spendValues[Math.floor(spendValues.length * 0.9)] ?? 0
      : 0;

  const restaurantAverageTicketCents =
    ticketValues.length > 0
      ? Math.round(
          ticketValues.reduce((sum, value) => sum + value, 0) /
            ticketValues.length,
        )
      : 0;

  return {
    restaurantAverageTicketCents,
    spendPercentile90Cents,
  };
}
