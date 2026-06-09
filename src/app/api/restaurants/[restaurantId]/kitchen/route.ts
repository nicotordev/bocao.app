import { NextResponse } from "next/server";
import { requireRestaurantAccess } from "@/lib/orders/api-auth";
import { getOrderFormatOptions } from "@/lib/orders/format-options";
import { listKitchenOrders } from "@/lib/kitchen/repository";

type RouteContext = {
  params: Promise<{ restaurantId: string }>;
};

export async function GET(_request: Request, { params }: RouteContext) {
  const { restaurantId } = await params;
  const access = await requireRestaurantAccess(restaurantId);

  if (!access.ok) {
    return NextResponse.json(
      { error: access.error },
      { status: access.status },
    );
  }

  const formatOptions = await getOrderFormatOptions();
  const data = await listKitchenOrders(restaurantId, formatOptions);
  return NextResponse.json(data);
}
