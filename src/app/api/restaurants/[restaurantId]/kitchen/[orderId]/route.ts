import { NextResponse } from "next/server";
import { requireRestaurantWriteAccess } from "@/lib/orders/api-auth";
import { getOrderFormatOptions } from "@/lib/orders/format-options";
import { updateKitchenOrder } from "@/lib/kitchen/repository";
import { updateKitchenOrderBodySchema } from "@/lib/kitchen/schemas";

type RouteContext = {
  params: Promise<{ restaurantId: string; orderId: string }>;
};

export async function PATCH(request: Request, { params }: RouteContext) {
  const { restaurantId, orderId } = await params;
  const access = await requireRestaurantWriteAccess(restaurantId);

  if (!access.ok) {
    return NextResponse.json(
      { error: access.error },
      { status: access.status },
    );
  }

  const parsed = updateKitchenOrderBodySchema.safeParse(
    await request.json().catch(() => null),
  );

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 },
    );
  }

  try {
    const formatOptions = await getOrderFormatOptions();
    const order = await updateKitchenOrder(
      restaurantId,
      decodeURIComponent(orderId),
      parsed.data,
      access.context.user.name,
      formatOptions,
    );

    return NextResponse.json({ order });
  } catch {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }
}
