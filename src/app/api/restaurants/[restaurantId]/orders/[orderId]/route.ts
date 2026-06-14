import { NextResponse } from "next/server";
import {
  requireRestaurantAccess,
  requireRestaurantWriteAccess,
} from "@/lib/orders/api-auth";
import { getOrderFormatOptions } from "@/lib/orders/format-options";
import {
  confirmOrder,
  deleteOrder,
  duplicateOrder,
  getOrder,
  updateOrder,
  updateOrderStatus,
} from "@/lib/orders/repository";
import {
  updateOrderBodySchema,
  updateOrderStatusBodySchema,
} from "@/lib/orders/schemas";

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
  const body = (await request.json().catch(() => null)) as unknown;
  const decodedOrderId = decodeURIComponent(orderId);
  const formatOptions = await getOrderFormatOptions();

  const statusParsed = updateOrderStatusBodySchema.safeParse(body);
  if (statusParsed.success) {
    const access = await requireRestaurantAccess(restaurantId);

    if (!access.ok) {
      return NextResponse.json(
        { error: access.error },
        { status: access.status },
      );
    }

    try {
      const order = await updateOrderStatus(
        restaurantId,
        decodedOrderId,
        statusParsed.data.status,
        formatOptions,
      );

      return NextResponse.json({ order });
    } catch {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
  }

  const updateParsed = updateOrderBodySchema.safeParse(body);
  if (!updateParsed.success) {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 },
    );
  }

  const writeAccess = await requireRestaurantWriteAccess(restaurantId);

  if (!writeAccess.ok) {
    return NextResponse.json(
      { error: writeAccess.error },
      { status: writeAccess.status },
    );
  }

  try {
    const order = await updateOrder(
      restaurantId,
      decodedOrderId,
      updateParsed.data,
      formatOptions,
    );

    return NextResponse.json({ order });
  } catch {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }
}

export async function POST(request: Request, { params }: RouteContext) {
  const { restaurantId, orderId } = await params;
  const access = await requireRestaurantWriteAccess(restaurantId);

  if (!access.ok) {
    return NextResponse.json(
      { error: access.error },
      { status: access.status },
    );
  }

  const body = (await request.json().catch(() => null)) as {
    action?: string;
  } | null;

  if (body?.action === "confirm") {
    try {
      const formatOptions = await getOrderFormatOptions();
      const order = await confirmOrder(
        restaurantId,
        decodeURIComponent(orderId),
        formatOptions,
      );

      return NextResponse.json({ order });
    } catch {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
  }

  if (body?.action === "duplicate") {
    try {
      const formatOptions = await getOrderFormatOptions();
      const order = await duplicateOrder(
        restaurantId,
        decodeURIComponent(orderId),
        access.context.user.name,
        formatOptions,
      );

      return NextResponse.json({ order }, { status: 201 });
    } catch {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const { restaurantId, orderId } = await params;
  const access = await requireRestaurantWriteAccess(restaurantId);

  if (!access.ok) {
    return NextResponse.json(
      { error: access.error },
      { status: access.status },
    );
  }

  try {
    await deleteOrder(restaurantId, decodeURIComponent(orderId));
    return new Response(null, { status: 204 });
  } catch {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }
}
