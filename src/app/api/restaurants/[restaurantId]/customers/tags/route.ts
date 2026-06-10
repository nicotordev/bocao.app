import { NextResponse } from "next/server";
import { requireRestaurantCustomersWriteAccess } from "@/lib/customers/api-auth";
import { bulkAssignCustomerTags } from "@/lib/customers/repository";
import { bulkCustomerTagsBodySchema } from "@/lib/customers/tags.schemas";

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
  const parsed = bulkCustomerTagsBodySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 },
    );
  }

  try {
    const affectedCount = await bulkAssignCustomerTags(
      restaurantId,
      parsed.data,
    );

    return NextResponse.json({ affectedCount });
  } catch (error) {
    console.error("Failed to update customer tags", error);

    if (
      error instanceof Error &&
      (error.message === "CUSTOMER_NOT_FOUND" ||
        error.message === "TAG_NOT_FOUND")
    ) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json(
      { error: "Could not update customer tags" },
      { status: 500 },
    );
  }
}
