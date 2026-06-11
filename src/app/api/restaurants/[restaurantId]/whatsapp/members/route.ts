import { NextResponse } from "next/server";
import { requireRestaurantWhatsAppAccess } from "@/lib/messaging/api-auth";
import { listAssignableMembers } from "@/lib/messaging/repository";

type RouteContext = {
  params: Promise<{ restaurantId: string }>;
};

export async function GET(_request: Request, { params }: RouteContext) {
  const { restaurantId } = await params;
  const access = await requireRestaurantWhatsAppAccess(restaurantId);

  if (!access.ok) {
    return NextResponse.json(
      { error: access.error },
      { status: access.status },
    );
  }

  try {
    const members = await listAssignableMembers(access.context.organization.id);
    return NextResponse.json({ members });
  } catch (error) {
    console.error("Failed to list assignable members", error);
    return NextResponse.json(
      { error: "Could not fetch members" },
      { status: 500 },
    );
  }
}
