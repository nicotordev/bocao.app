import { NextResponse } from "next/server";
import { requireRestaurantAccess } from "@/lib/orders/api-auth";
import { getOrderFormatOptions } from "@/lib/orders/format-options";
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

  const formatOptions = await getOrderFormatOptions();
  const order = await getOrder(
    restaurantId,
    decodeURIComponent(orderId),
    formatOptions,
  );

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
    const formatOptions = await getOrderFormatOptions();
    const order = await updateOrderStatus(
      restaurantId,
      decodeURIComponent(orderId),
      parsed.data.status,
      formatOptions,
    );

    return NextResponse.json({ order });
  } catch {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }
}
