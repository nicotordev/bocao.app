import { NextResponse } from "next/server";
import { parseKitchenListSearchParams } from "@/lib/kitchen/list-filters";
import { listKitchenOrders } from "@/lib/kitchen/repository";
import { requireRestaurantAccess } from "@/lib/orders/api-auth";
import { getOrderFormatOptions } from "@/lib/orders/format-options";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ restaurantId: string }>;
};

export async function GET(request: Request, { params }: RouteContext) {
  const { restaurantId } = await params;
  const access = await requireRestaurantAccess(restaurantId);

  if (!access.ok) {
    return NextResponse.json(
      { error: access.error },
      { status: access.status },
    );
  }

  const restaurant = await prisma.restaurant.findUnique({
    where: { id: restaurantId },
    select: { timezone: true },
  });

  const timezone = restaurant?.timezone ?? "America/Santiago";
  const { searchParams } = new URL(request.url);
  const filters = parseKitchenListSearchParams(
    Object.fromEntries(searchParams.entries()),
    timezone,
  );
  const formatOptions = await getOrderFormatOptions();
  const data = await listKitchenOrders(
    restaurantId,
    formatOptions,
    filters,
    timezone,
  );
  return NextResponse.json(data);
}
