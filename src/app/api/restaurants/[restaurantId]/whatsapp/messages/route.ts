import { NextResponse } from "next/server";
import { requireRestaurantWhatsAppWriteAccess } from "@/lib/messaging/api-auth";
import { mapMessageListItem } from "@/lib/messaging/mappers";
import { sendWhatsAppMessageBodySchema } from "@/lib/messaging/schemas";
import { sendWhatsAppMessage } from "@/lib/messaging/send-whatsapp-message";

type RouteContext = {
  params: Promise<{ restaurantId: string }>;
};

export async function POST(request: Request, { params }: RouteContext) {
  const { restaurantId } = await params;
  const access = await requireRestaurantWhatsAppWriteAccess(restaurantId);

  if (!access.ok) {
    return NextResponse.json(
      { error: access.error },
      { status: access.status },
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = sendWhatsAppMessageBodySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 },
    );
  }

  try {
    const message = await sendWhatsAppMessage({
      tenantId: access.context.organization.id,
      restaurantId,
      conversationId: parsed.data.conversationId,
      body: parsed.data.body,
      fromUserId: access.context.user.id,
    });

    return NextResponse.json(
      { message: mapMessageListItem(message) },
      { status: 201 },
    );
  } catch (error) {
    console.error("Failed to send WhatsApp message", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Could not send message",
      },
      { status: 500 },
    );
  }
}
