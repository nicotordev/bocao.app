import { NextResponse } from "next/server";
import { requireRestaurantCustomersAccess } from "@/lib/customers/api-auth";
import { listCustomers } from "@/lib/customers/repository";

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
    const customers = await listCustomers(restaurantId);
    return NextResponse.json({ customers });
  } catch (error) {
    console.error("Failed to list customer options", error);
    return NextResponse.json(
      { error: "Could not fetch customers" },
      { status: 500 },
    );
  }
}
