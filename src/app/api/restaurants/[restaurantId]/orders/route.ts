import { NextResponse } from "next/server";
import { z } from "zod";
import { requireRestaurantAccess } from "@/lib/orders/api-auth";
import { listOrders } from "@/lib/orders/repository";
import { orderChannelSchema, orderStatusSchema } from "@/lib/orders/schemas";

const listOrdersQuerySchema = z.object({
  search: z.string().optional(),
  status: z.union([orderStatusSchema, z.literal("all")]).optional(),
  channel: z.union([orderChannelSchema, z.literal("all")]).optional(),
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
  const parsed = listOrdersQuerySchema.safeParse({
    search: searchParams.get("search") ?? undefined,
    status: searchParams.get("status") ?? undefined,
    channel: searchParams.get("channel") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid query parameters" },
      { status: 400 },
    );
  }

  const data = await listOrders(restaurantId, parsed.data);
  return NextResponse.json(data);
}
