import { NextResponse } from "next/server";
import { requireRestaurantAccess } from "@/lib/orders/api-auth";
import { signKitchenRealtimeToken } from "@/lib/realtime/jwt";
import { prisma } from "@/lib/prisma";

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

  const restaurant = await prisma.restaurant.findUnique({
    where: { id: restaurantId },
    select: { organizationId: true },
  });

  if (!restaurant) {
    return NextResponse.json(
      { error: "Restaurant not found" },
      { status: 404 },
    );
  }

  const token = signKitchenRealtimeToken({
    userId: access.context.user.id,
    restaurantId,
    tenantId: restaurant.organizationId,
  });

  if (!token) {
    return NextResponse.json(
      { error: "Realtime is not configured" },
      { status: 503 },
    );
  }

  const wsUrl = process.env.NEXT_PUBLIC_KITCHEN_WS_URL?.trim() || null;

  return NextResponse.json({
    token,
    restaurantId,
    wsUrl,
    expiresInSeconds: 300,
  });
}
