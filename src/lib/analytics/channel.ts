import type { OrderType, Prisma } from "@/generated/prisma/client";
import type { AnalyticsChannel } from "@/lib/analytics/types";

const DELIVERY_CHANNELS = ["uberEats", "rappi"] as const;

export function normalizeAnalyticsChannel(
  channel: string | null | undefined,
  orderType: OrderType,
): AnalyticsChannel {
  if (channel === "pos") {
    return "pos";
  }

  if (channel === "whatsapp") {
    return "whatsapp";
  }

  if (channel === "web") {
    return "web";
  }

  if (
    channel === "uberEats" ||
    channel === "rappi" ||
    orderType === "DELIVERY"
  ) {
    return "delivery";
  }

  return "manual";
}

export function analyticsChannelToPrismaWhere(
  channel: AnalyticsChannel,
): Prisma.OrderWhereInput {
  switch (channel) {
    case "pos":
      return { channel: "pos" };
    case "whatsapp":
      return { channel: "whatsapp" };
    case "web":
      return { channel: "web" };
    case "delivery":
      return {
        OR: [
          { channel: { in: [...DELIVERY_CHANNELS] } },
          { type: "DELIVERY" },
        ],
      };
    case "manual":
      return {
        NOT: {
          OR: [
            { channel: { in: ["pos", "whatsapp", "web", ...DELIVERY_CHANNELS] } },
            { type: "DELIVERY" },
          ],
        },
      };
    default:
      return {};
  }
}
