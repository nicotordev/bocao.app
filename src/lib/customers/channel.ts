import type { OrderType } from "@/generated/prisma/client";
import type { CustomerChannel } from "@/lib/customers/types";

export function mapOrderToCustomerChannel(
  channel: string | null | undefined,
  type: OrderType,
): CustomerChannel {
  if (channel === "whatsapp") {
    return "whatsapp";
  }

  if (channel === "web") {
    return "web";
  }

  if (channel === "dineIn" || type === "DINE_IN") {
    return "in_person";
  }

  if (type === "DELIVERY" || type === "TAKEOUT") {
    return "delivery";
  }

  return "web";
}

export function resolvePrimaryChannel(
  channelCounts: Partial<Record<CustomerChannel, number>>,
  hasReservations: boolean,
): CustomerChannel {
  const entries = Object.entries(channelCounts) as Array<
    [CustomerChannel, number]
  >;

  if (entries.length === 0) {
    return hasReservations ? "reservation" : "in_person";
  }

  entries.sort((left, right) => right[1] - left[1]);
  return entries[0]?.[0] ?? "in_person";
}
