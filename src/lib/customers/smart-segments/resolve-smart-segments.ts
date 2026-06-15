import "server-only";

import { formatMoney, formatRelativeDate } from "@/lib/customers/format";
import type { CustomerListItem } from "@/lib/customers/types";
import {
  findCustomerSmartSegmentSnapshot,
  parseStoredSmartSegments,
} from "@/lib/customers/smart-segments/repository";
import type {
  CustomerSmartSegment,
  CustomerSmartSegmentCard,
  CustomerSmartSegmentsMeta,
} from "@/lib/customers/smart-segments/types";

type ResolveSmartSegmentsInput = {
  restaurantId: string;
  locale: string;
  customers: CustomerListItem[];
  neverLabel: string;
  currency: string;
};

export type ResolvedCustomerSmartSegments = {
  segments: CustomerSmartSegmentCard[];
  meta: CustomerSmartSegmentsMeta;
  customerIdsBySegmentId: Map<string, Set<string>>;
};

function buildSmartSegmentCards(
  segments: CustomerSmartSegment[],
  customers: CustomerListItem[],
  locale: string,
  neverLabel: string,
  currency: string,
): CustomerSmartSegmentCard[] {
  const customersById = new Map(
    customers.map((customer) => [customer.id, customer]),
  );

  return segments.map((segment) => {
    const matched = segment.customerIds
      .map((customerId) => customersById.get(customerId))
      .filter((customer): customer is CustomerListItem => Boolean(customer));

    const averageTicketCents =
      matched.length > 0
        ? Math.round(
            matched.reduce(
              (sum, customer) => sum + customer.averageTicketCents,
              0,
            ) / matched.length,
          )
        : 0;

    const lastActivity = matched
      .map((customer) => customer.lastVisitAt)
      .filter((value): value is string => Boolean(value))
      .sort(
        (left, right) => new Date(right).getTime() - new Date(left).getTime(),
      )[0];

    return {
      id: segment.id,
      name: segment.name,
      description: segment.description,
      customerCount: matched.length,
      averageTicket: formatMoney(averageTicketCents, currency),
      lastActivityRelative: formatRelativeDate(
        lastActivity ? new Date(lastActivity) : null,
        locale,
        neverLabel,
      ),
      rationale: segment.rationale,
    };
  });
}

export async function resolveCustomerSmartSegments(
  input: ResolveSmartSegmentsInput,
): Promise<ResolvedCustomerSmartSegments> {
  const snapshot = await findCustomerSmartSegmentSnapshot({
    restaurantId: input.restaurantId,
    locale: input.locale,
  });

  const storedSegments = snapshot
    ? parseStoredSmartSegments(snapshot.segments)
    : [];

  const customerIdsBySegmentId = new Map<string, Set<string>>();

  for (const segment of storedSegments) {
    customerIdsBySegmentId.set(segment.id, new Set(segment.customerIds));
  }

  return {
    segments: buildSmartSegmentCards(
      storedSegments,
      input.customers,
      input.locale,
      input.neverLabel,
      input.currency,
    ),
    meta: {
      source: snapshot?.source === "rules" ? "rules" : "ai",
      generatedAt: snapshot?.generatedAt.toISOString() ?? null,
    },
    customerIdsBySegmentId,
  };
}

export function getSmartSegmentCustomerIds(
  customerIdsBySegmentId: Map<string, Set<string>>,
  smartSegmentId: string | undefined,
): Set<string> | null {
  if (!smartSegmentId) {
    return null;
  }

  return customerIdsBySegmentId.get(smartSegmentId) ?? new Set();
}
