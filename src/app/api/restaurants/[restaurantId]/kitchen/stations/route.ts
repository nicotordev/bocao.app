import { NextResponse } from "next/server";
import {
  createKitchenStation,
  listKitchenStations,
} from "@/lib/kitchen/stations/repository";
import { createKitchenStationBodySchema } from "@/lib/kitchen/stations/schemas";
import { getKitchenStationValidationMessages } from "@/lib/kitchen/stations/validation-messages";
import {
  requireRestaurantAccess,
  requireRestaurantWriteAccess,
} from "@/lib/orders/api-auth";

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
  const validationMessages = await getKitchenStationValidationMessages();
  const parsed =
    createKitchenStationBodySchema(validationMessages).safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error:
          parsed.error.issues[0]?.message ?? validationMessages.invalidBody,
      },
      { status: 400 },
    );
  }

  const station = await createKitchenStation(restaurantId, parsed.data);
  return NextResponse.json({ station }, { status: 201 });
}
