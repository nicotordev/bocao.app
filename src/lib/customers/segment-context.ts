import type { SegmentContext } from "@/lib/customers/segments";
import { prisma } from "@/lib/prisma";

type CustomerSpendRow = {
  totalSpendCents: bigint;
  orderCount: bigint;
};

export async function fetchRestaurantSegmentContext(
  restaurantId: string,
): Promise<SegmentContext> {
  const rows = await prisma.$queryRaw<CustomerSpendRow[]>`
    SELECT
      COALESCE(SUM(o."totalCents"), 0) AS "totalSpendCents",
      COUNT(o.id) AS "orderCount"
    FROM "Customer" c
    LEFT JOIN "OrderCustomer" oc ON oc."customerId" = c.id
    LEFT JOIN "Order" o ON o.id = oc."orderId"
    WHERE c."restaurantId" = ${restaurantId}
    GROUP BY c.id
  `;

  const spendValues = rows
    .map((row) => Number(row.totalSpendCents))
    .filter((value) => value > 0)
    .sort((left, right) => left - right);

  const ticketValues = rows
    .filter((row) => Number(row.orderCount) > 0)
    .map((row) =>
      Math.round(Number(row.totalSpendCents) / Number(row.orderCount)),
    );

  const spendPercentile90Cents =
    spendValues.length > 0
      ? (spendValues[Math.floor(spendValues.length * 0.9)] ?? 0)
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
