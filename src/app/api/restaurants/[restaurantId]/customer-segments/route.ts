import { NextResponse } from "next/server";
import {
  requireRestaurantCustomersAccess,
  requireRestaurantCustomersWriteAccess,
} from "@/lib/customers/api-auth";
import { createSavedSegmentBodySchema } from "@/lib/customers/saved-segments.schemas";
import {
  createSavedCustomerSegment,
  listSavedCustomerSegments,
} from "@/lib/customers/saved-segments.repository";

type RouteContext = {
  params: Promise<{ restaurantId: string }>;
};

export async function GET(_request: Request, { params }: RouteContext) {
  const { restaurantId } = await params;
  const access = await requireRestaurantCustomersAccess(restaurantId);

  if (!access.ok) {
    return NextResponse.json(
      { error: access.error },
      { status: access.status },
    );
  }

  try {
    const segments = await listSavedCustomerSegments(restaurantId);
    return NextResponse.json({ segments });
  } catch (error) {
    console.error("Failed to list customer segments", error);
    return NextResponse.json(
      { error: "Could not fetch customer segments" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request, { params }: RouteContext) {
  const { restaurantId } = await params;
  const access = await requireRestaurantCustomersWriteAccess(restaurantId);

  if (!access.ok) {
    return NextResponse.json(
      { error: access.error },
      { status: access.status },
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = createSavedSegmentBodySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 },
    );
  }

  try {
    const segment = await createSavedCustomerSegment(restaurantId, parsed.data);
    return NextResponse.json({ segment }, { status: 201 });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "CUSTOMER_NOT_FOUND") {
        return NextResponse.json(
          { error: "One or more customers were not found" },
          { status: 400 },
        );
      }
    }

    console.error("Failed to create customer segment", error);
    return NextResponse.json(
      { error: "Could not create customer segment" },
      { status: 500 },
    );
  }
}
