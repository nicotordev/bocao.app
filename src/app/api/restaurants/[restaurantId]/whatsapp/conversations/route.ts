import { NextResponse } from "next/server";
import { requireRestaurantWhatsAppAccess } from "@/lib/messaging/api-auth";
import { conversationsListQuerySchema } from "@/lib/messaging/schemas";
import { listConversations } from "@/lib/messaging/repository";

type RouteContext = {
  params: Promise<{ restaurantId: string }>;
};

export async function GET(request: Request, { params }: RouteContext) {
  const { restaurantId } = await params;
  const access = await requireRestaurantWhatsAppAccess(restaurantId);

  if (!access.ok) {
    return NextResponse.json(
      { error: access.error },
      { status: access.status },
    );
  }

  const { searchParams } = new URL(request.url);
  const parsed = conversationsListQuerySchema.safeParse({
    status: searchParams.get("status") ?? undefined,
    assignment: searchParams.get("assignment") ?? undefined,
    search: searchParams.get("search") ?? undefined,
    conversationId: searchParams.get("conversationId") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid query parameters" },
      { status: 400 },
    );
  }

  try {
    const data = await listConversations(
      restaurantId,
      {
        status: parsed.data.status ?? "open",
        assignment: parsed.data.assignment ?? "all",
        search: parsed.data.search ?? "",
        conversationId: parsed.data.conversationId,
      },
      access.context.user.id,
    );

    return NextResponse.json(data);
  } catch (error) {
    console.error("Failed to list WhatsApp conversations", error);
    return NextResponse.json(
      { error: "Could not fetch conversations" },
      { status: 500 },
    );
  }
}
