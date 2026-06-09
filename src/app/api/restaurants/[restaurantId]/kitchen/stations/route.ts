import { NextResponse } from "next/server";
import {
  requireRestaurantAccess,
  requireRestaurantWriteAccess,
} from "@/lib/orders/api-auth";
import { createKitchenStationBodySchema } from "@/lib/kitchen/stations/schemas";
import {
  createKitchenStation,
  listKitchenStations,
} from "@/lib/kitchen/stations/repository";

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

  const data = await listKitchenStations(restaurantId);
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

  const body = await request.json().catch(() => null);
  const parsed = createKitchenStationBodySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request body" },
      { status: 400 },
    );
  }

  const station = await createKitchenStation(restaurantId, parsed.data);
  return NextResponse.json({ station }, { status: 201 });
}
