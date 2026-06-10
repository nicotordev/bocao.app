import { NextResponse } from "next/server";
import { requireRestaurantCustomersWriteAccess } from "@/lib/customers/api-auth";
import { deleteCustomers } from "@/lib/customers/repository";
import { deleteCustomersBodySchema } from "@/lib/customers/schemas";

type RouteContext = {
  params: Promise<{ restaurantId: string }>;
};

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
  const parsed = deleteCustomersBodySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 },
    );
  }

  try {
    const deletedCount = await deleteCustomers(
      restaurantId,
      parsed.data.customerIds,
    );

    if (deletedCount === 0) {
      return NextResponse.json(
        { error: "No customers were deleted" },
        { status: 404 },
      );
    }

    return NextResponse.json({ deletedCount });
  } catch (error) {
    console.error("Failed to delete customers", error);
    return NextResponse.json(
      { error: "Could not delete customers" },
      { status: 500 },
    );
  }
}
