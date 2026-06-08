import { prisma } from "@/lib/prisma";

export async function generateOrderNumber(
  restaurantId: string,
): Promise<string> {
  const latest = await prisma.order.findFirst({
    where: { restaurantId },
    orderBy: { createdAt: "desc" },
    select: { orderNumber: true },
  });

  if (!latest) {
    return "#1001";
  }

  const match = latest.orderNumber.match(/#(\d+)/);
  const nextNumber = match ? Number.parseInt(match[1], 10) + 1 : 1001;

  return `#${nextNumber}`;
}
