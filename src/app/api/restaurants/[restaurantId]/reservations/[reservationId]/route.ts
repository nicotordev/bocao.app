import { NextResponse } from "next/server";
import {
  requireRestaurantReservationsWriteAccess,
} from "@/lib/reservations/api-auth";
import {
  deleteReservation,
  updateReservation,
} from "@/lib/reservations/repository";
import { updateReservationSchema } from "@/lib/reservations/schemas";

type RouteContext = {
  params: Promise<{ restaurantId: string; reservationId: string }>;
};

export async function PATCH(request: Request, { params }: RouteContext) {
  const { restaurantId, reservationId } = await params;
  const access = await requireRestaurantReservationsWriteAccess(restaurantId);

  if (!access.ok) {
    return NextResponse.json(
      { error: access.error },
      { status: access.status },
    );
  }

  const parsed = updateReservationSchema.safeParse(
    await request.json().catch(() => null),
  );

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request body", details: parsed.error.format() },
      { status: 400 },
    );
  }

  try {
    const reservation = await updateReservation(
      restaurantId,
      reservationId,
      parsed.data,
    );
    return NextResponse.json({ reservation });
  } catch (error) {
    console.error("Failed to update reservation", error);
    const message =
      error instanceof Error ? error.message : "Could not update reservation";
    return NextResponse.json(
      { error: message },
      { status: message === "Reservation not found" ? 404 : 500 },
    );
  }
}

export async function DELETE(request: Request, { params }: RouteContext) {
  const { restaurantId, reservationId } = await params;
  const access = await requireRestaurantReservationsWriteAccess(restaurantId);

  if (!access.ok) {
    return NextResponse.json(
      { error: access.error },
      { status: access.status },
    );
  }

  try {
    await deleteReservation(restaurantId, reservationId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete reservation", error);
    const message =
      error instanceof Error ? error.message : "Could not delete reservation";
    return NextResponse.json(
      { error: message },
      { status: message === "Reservation not found" ? 404 : 500 },
    );
  }
}
