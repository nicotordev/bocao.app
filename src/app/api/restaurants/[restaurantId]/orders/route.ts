import { NextResponse } from "next/server";
import { z } from "zod";
import {
  requireRestaurantAccess,
  requireRestaurantWriteAccess,
} from "@/lib/orders/api-auth";
import {
  getCreateOrderLabels,
  getOrderFormatOptions,
} from "@/lib/orders/format-options";
import { ordersListQuerySchema } from "@/lib/orders/filters";
import {
  createOrder,
  listOrders,
  listOrdersBoard,
} from "@/lib/orders/repository";
import { createOrderBodySchema } from "@/lib/orders/schemas";

const listOrdersRequestSchema = ordersListQuerySchema.extend({
  mode: z.enum(["list", "board"]).optional().default("list"),
});

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

  const { searchParams } = new URL(request.url);
  const parsed = listOrdersRequestSchema.safeParse({
    search: searchParams.get("search") ?? undefined,
    status: searchParams.get("status") ?? undefined,
    channel: searchParams.get("channel") ?? undefined,
    from: searchParams.get("from") ?? undefined,
    to: searchParams.get("to") ?? undefined,
    page: searchParams.get("page") ?? undefined,
    pageSize: searchParams.get("pageSize") ?? undefined,
    mode: searchParams.get("mode") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid query parameters" },
      { status: 400 },
    );
  }

  const formatOptions = await getOrderFormatOptions();
  const { mode, ...filters } = parsed.data;

  if (mode === "board") {
    const orders = await listOrdersBoard(restaurantId, filters, formatOptions);

    return NextResponse.json({
      orders,
      restaurantId,
      updatedAt: new Date().toISOString(),
    });
  }

  const data = await listOrders(restaurantId, filters, formatOptions);
  return NextResponse.json(data);
}

export async function POST(request: Request, { params }: RouteContext) {
  const { restaurantId } = await params;
  const access = await requireRestaurantWriteAccess(restaurantId);

  if (!access.ok) {
    return NextResponse.json(
      { error: access.error },
      { status: access.status },
    );
  }

  const parsed = createOrderBodySchema.safeParse(
    await request.json().catch(() => null),
  );

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 },
    );
  }

  try {
    const [createLabels, formatOptions] = await Promise.all([
      getCreateOrderLabels(),
      getOrderFormatOptions(),
    ]);
    const order = await createOrder(
      restaurantId,
      parsed.data,
      access.context.user.name,
      createLabels,
      formatOptions,
    );

    return NextResponse.json({ order }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Could not create order" },
      { status: 500 },
    );
  }
}
