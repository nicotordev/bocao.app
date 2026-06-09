import { NextResponse } from "next/server";
import {
  deleteKitchenStation,
  reorderKitchenStation,
  toggleKitchenStationActive,
  updateKitchenStation,
  validateKitchenStationCategoryUpdate,
} from "@/lib/kitchen/stations/repository";
import {
  createUpdateKitchenStationBodySchema,
  reorderKitchenStationBodySchema,
} from "@/lib/kitchen/stations/schemas";
import { getKitchenStationValidationMessages } from "@/lib/kitchen/stations/validation-messages";
import { requireRestaurantWriteAccess } from "@/lib/orders/api-auth";

type RouteContext = {
  params: Promise<{ restaurantId: string; stationId: string }>;
};

export async function PATCH(request: Request, { params }: RouteContext) {
  const { restaurantId, stationId } = await params;
  const access = await requireRestaurantWriteAccess(restaurantId);

  if (!access.ok) {
    return NextResponse.json(
      { error: access.error },
      { status: access.status },
    );
  }

  const body = await request.json().catch(() => null);

  if (
    body &&
    typeof body === "object" &&
    "direction" in body &&
    Object.keys(body).length === 1
  ) {
    const parsedReorder = reorderKitchenStationBodySchema.safeParse(body);

    if (!parsedReorder.success) {
      return NextResponse.json(
        {
          error:
            parsedReorder.error.issues[0]?.message ?? "Invalid request body",
        },
        { status: 400 },
      );
    }

    const data = await reorderKitchenStation(
      restaurantId,
      stationId,
      parsedReorder.data,
    );
    return NextResponse.json(data);
  }

  if (
    body &&
    typeof body === "object" &&
    "toggleActive" in body &&
    body.toggleActive === true
  ) {
    const station = await toggleKitchenStationActive(restaurantId, stationId);

    if (!station) {
      return NextResponse.json({ error: "Station not found" }, { status: 404 });
    }

    return NextResponse.json({ station });
  }

  const validationMessages = await getKitchenStationValidationMessages();
  const parsed =
    createUpdateKitchenStationBodySchema(validationMessages).safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error:
          parsed.error.issues[0]?.message ?? validationMessages.invalidBody,
      },
      { status: 400 },
    );
  }

  const categoryValidationError = await validateKitchenStationCategoryUpdate(
    restaurantId,
    stationId,
    parsed.data,
    validationMessages,
  );

  if (categoryValidationError) {
    return NextResponse.json(
      { error: categoryValidationError },
      { status: 400 },
    );
  }

  const station = await updateKitchenStation(
    restaurantId,
    stationId,
    parsed.data,
  );

  if (!station) {
    return NextResponse.json({ error: "Station not found" }, { status: 404 });
  }

  return NextResponse.json({ station });
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const { restaurantId, stationId } = await params;
  const access = await requireRestaurantWriteAccess(restaurantId);

  if (!access.ok) {
    return NextResponse.json(
      { error: access.error },
      { status: access.status },
    );
  }

  const result = await deleteKitchenStation(restaurantId, stationId);

  if (!result.ok) {
    if (result.reason === "has_active_orders") {
      return NextResponse.json(
        { error: "Station has active orders" },
        { status: 409 },
      );
    }

    return NextResponse.json({ error: "Station not found" }, { status: 404 });
  }

  return new NextResponse(null, { status: 204 });
}
