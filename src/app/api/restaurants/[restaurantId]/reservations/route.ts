import { NextResponse } from "next/server";
import { reservationsListQuerySchema } from "@/lib/reservations/filters";
import {
  requireRestaurantReservationsAccess,
  requireRestaurantReservationsWriteAccess,
} from "@/lib/reservations/api-auth";
import {
  createReservation,
  listReservations,
} from "@/lib/reservations/repository";
import { createReservationSchema } from "@/lib/reservations/schemas";

type RouteContext = {
  params: Promise<{ restaurantId: string }>;
};

export async function GET(request: Request, { params }: RouteContext) {
  const { restaurantId } = await params;
  const access = await requireRestaurantReservationsAccess(restaurantId);

  if (!access.ok) {
    return NextResponse.json(
      { error: access.error },
      { status: access.status },
    );
  }

  const { searchParams } = new URL(request.url);
  const parsed = reservationsListQuerySchema.safeParse({
    search: searchParams.get("search") ?? undefined,
    status: searchParams.get("status") ?? undefined,
    from: searchParams.get("from") ?? undefined,
    to: searchParams.get("to") ?? undefined,
    page: searchParams.get("page") ?? undefined,
    pageSize: searchParams.get("pageSize") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid query parameters" },
      { status: 400 },
    );
  }

  try {
    const data = await listReservations(restaurantId, parsed.data);
    return NextResponse.json({
      ...data,
      restaurantId,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Failed to list reservations", error);
    return NextResponse.json(
      { error: "Could not fetch reservations" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request, { params }: RouteContext) {
  const { restaurantId } = await params;
  const access = await requireRestaurantReservationsWriteAccess(restaurantId);

  if (!access.ok) {
    return NextResponse.json(
      { error: access.error },
      { status: access.status },
    );
  }

  const parsed = createReservationSchema.safeParse(
    await request.json().catch(() => null),
  );

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request body", details: parsed.error.format() },
      { status: 400 },
    );
  }

  try {
    const reservations = await createReservation(restaurantId, parsed.data);
    return NextResponse.json({ reservations }, { status: 201 });
  } catch (error) {
    console.error("Failed to create reservation", error);
    return NextResponse.json(
      { error: "Could not create reservation" },
      { status: 500 },
    );
  }
}
