import { NextResponse } from "next/server";
import { requireRestaurantAccess } from "@/lib/orders/api-auth";
import { getOrder, updateOrderStatus } from "@/lib/orders/repository";
import { updateOrderStatusBodySchema } from "@/lib/orders/schemas";

type RouteContext = {
  params: Promise<{ restaurantId: string; orderId: string }>;
};

export async function GET(_request: Request, { params }: RouteContext) {
  const { restaurantId, orderId } = await params;
  const access = await requireRestaurantAccess(restaurantId);

  if (!access.ok) {
    return NextResponse.json(
      { error: access.error },
      { status: access.status },
    );
  }

  const order = await getOrder(restaurantId, decodeURIComponent(orderId));

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  return NextResponse.json({ order });
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const { restaurantId, orderId } = await params;
  const access = await requireRestaurantAccess(restaurantId);

  if (!access.ok) {
    return NextResponse.json(
      { error: access.error },
      { status: access.status },
    );
  }

  const body = (await request.json().catch(() => null)) as unknown;
  const parsed = updateOrderStatusBodySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 },
    );
  }

  try {
    const order = await updateOrderStatus(
      restaurantId,
      decodeURIComponent(orderId),
      parsed.data.status,
    );

    return NextResponse.json({ order });
  } catch {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }
}
