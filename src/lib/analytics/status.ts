import type { OrderStatus } from "@/generated/prisma/client";
import type { AnalyticsOrderStatus } from "@/lib/analytics/types";

export function analyticsStatusToDb(
  status: AnalyticsOrderStatus | undefined,
): OrderStatus | undefined {
  switch (status) {
    case "confirmed":
      return "CONFIRMED";
    case "completed":
      return "COMPLETED";
    case "cancelled":
      return "CANCELLED";
    default:
      return undefined;
  }
}
