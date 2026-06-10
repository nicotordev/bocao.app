import type {
  CustomerActivityEvent,
  CustomerActivityType,
  CustomerDetail,
  CustomerListItem,
} from "@/lib/customers/types";

type BuildActivityInput = {
  customers: CustomerListItem[];
  detailsById?: Map<string, CustomerDetail>;
  limit?: number;
};

function buildEventId(
  customerId: string,
  type: CustomerActivityType,
  occurredAt: string,
): string {
  return `${customerId}-${type}-${occurredAt}`;
}

export function buildCustomersActivityFeed({
  customers,
  detailsById,
  limit = 30,
}: BuildActivityInput): CustomerActivityEvent[] {
  const events: CustomerActivityEvent[] = [];

  for (const customer of customers) {
    const detail = detailsById?.get(customer.id);

    for (const order of detail?.orders ?? []) {
      events.push({
        id: buildEventId(customer.id, "order", order.createdAt),
        customerId: customer.id,
        customerName: customer.name,
        type: "order",
        channel: order.channel,
        messageKey: "activity.order",
        occurredAt: order.createdAt,
        occurredAtRelative: order.createdAtRelative,
      });
    }

    for (const reservation of detail?.reservations ?? []) {
      events.push({
        id: buildEventId(customer.id, "reservation", reservation.scheduledAt),
        customerId: customer.id,
        customerName: customer.name,
        type: "reservation",
        channel: "reservation",
        messageKey: "activity.reservation",
        occurredAt: reservation.scheduledAt,
        occurredAtRelative: reservation.scheduledAtRelative,
      });
    }

    if (customer.segments.includes("inactive") && customer.lastVisitAt) {
      const inactiveDays = Math.floor(
        (Date.now() - new Date(customer.lastVisitAt).getTime()) /
          (24 * 60 * 60 * 1000),
      );

      events.push({
        id: buildEventId(customer.id, "inactive", customer.lastVisitAt),
        customerId: customer.id,
        customerName: customer.name,
        type: "inactive",
        messageKey: "activity.inactive",
        messageValues: { days: inactiveDays },
        occurredAt: customer.lastVisitAt,
        occurredAtRelative: customer.lastVisitRelative,
      });
    }

    if (customer.segments.includes("vip")) {
      events.push({
        id: buildEventId(customer.id, "segment_change", customer.createdAt),
        customerId: customer.id,
        customerName: customer.name,
        type: "segment_change",
        messageKey: "activity.markedVip",
        occurredAt: customer.lastVisitAt ?? customer.createdAt,
        occurredAtRelative: customer.lastVisitRelative,
      });
    }

    for (const tag of detail?.tagHistory ?? []) {
      events.push({
        id: buildEventId(customer.id, "tag_added", tag.assignedAt),
        customerId: customer.id,
        customerName: customer.name,
        type: "tag_added",
        messageKey: "activity.tagAdded",
        messageValues: { tag: tag.name },
        occurredAt: tag.assignedAt,
        occurredAtRelative: tag.assignedAtRelative,
      });
    }

    if (customer.notes) {
      events.push({
        id: buildEventId(customer.id, "note", customer.createdAt),
        customerId: customer.id,
        customerName: customer.name,
        type: "note",
        messageKey: "activity.noteAdded",
        occurredAt: customer.createdAt,
        occurredAtRelative: customer.createdAtRelative,
      });
    }
  }

  return events
    .sort(
      (left, right) =>
        new Date(right.occurredAt).getTime() -
        new Date(left.occurredAt).getTime(),
    )
    .slice(0, limit);
}
