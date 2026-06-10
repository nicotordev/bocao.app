import { NextResponse } from "next/server";
import { requireRestaurantCustomersWriteAccess } from "@/lib/customers/api-auth";
import { addSavedSegmentMembersBodySchema } from "@/lib/customers/saved-segments.schemas";
import { addSavedCustomerSegmentMembers } from "@/lib/customers/saved-segments.repository";

type RouteContext = {
  params: Promise<{ restaurantId: string; segmentId: string }>;
};

export async function POST(request: Request, { params }: RouteContext) {
  const { restaurantId, segmentId } = await params;
  const access = await requireRestaurantCustomersWriteAccess(restaurantId);

  if (!access.ok) {
    return NextResponse.json(
      { error: access.error },
      { status: access.status },
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = addSavedSegmentMembersBodySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 },
    );
  }

  try {
    const segment = await addSavedCustomerSegmentMembers(
      restaurantId,
      segmentId,
      parsed.data.customerIds,
    );

    return NextResponse.json({ segment });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "SEGMENT_NOT_FOUND") {
        return NextResponse.json({ error: "Segment not found" }, { status: 404 });
      }

      if (error.message === "CUSTOMER_NOT_FOUND") {
        return NextResponse.json(
          { error: "One or more customers were not found" },
          { status: 400 },
        );
      }
    }

    console.error("Failed to add customers to segment", error);
    return NextResponse.json(
      { error: "Could not add customers to segment" },
      { status: 500 },
    );
  }
}
