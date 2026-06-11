import { NextResponse } from "next/server";
import {
  requireRestaurantWhatsAppAccess,
  requireRestaurantWhatsAppWriteAccess,
} from "@/lib/messaging/api-auth";
import { emitMessagingEventAfterCommit } from "@/lib/messaging/events";
import { updateConversationBodySchema } from "@/lib/messaging/schemas";
import {
  getConversationMessages,
  updateConversation,
} from "@/lib/messaging/repository";

type RouteContext = {
  params: Promise<{ restaurantId: string; conversationId: string }>;
};

export async function GET(_request: Request, { params }: RouteContext) {
  const { restaurantId, conversationId } = await params;
  const access = await requireRestaurantWhatsAppAccess(restaurantId);

  if (!access.ok) {
    return NextResponse.json(
      { error: access.error },
      { status: access.status },
    );
  }

  try {
    const data = await getConversationMessages(restaurantId, conversationId);

    if (!data) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Failed to fetch WhatsApp conversation", error);
    return NextResponse.json(
      { error: "Could not fetch conversation" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const { restaurantId, conversationId } = await params;
  const access = await requireRestaurantWhatsAppWriteAccess(restaurantId);

  if (!access.ok) {
    return NextResponse.json(
      { error: access.error },
      { status: access.status },
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = updateConversationBodySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 },
    );
  }

  if (!parsed.data.status && parsed.data.assignedToId === undefined) {
    return NextResponse.json(
      { error: "No updates provided" },
      { status: 400 },
    );
  }

  try {
    const conversation = await updateConversation(
      restaurantId,
      conversationId,
      parsed.data,
    );

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 },
      );
    }

    const tenantId = access.context.organization.id;
    const eventType =
      parsed.data.status === "closed"
        ? ("conversation.closed" as const)
        : parsed.data.assignedToId !== undefined
          ? ("conversation.assigned" as const)
          : ("conversation.updated" as const);

    await emitMessagingEventAfterCommit({
      tenantId,
      restaurantId,
      payload: {
        type: eventType,
        conversationId,
      },
    });

    return NextResponse.json({ conversation });
  } catch (error) {
    console.error("Failed to update WhatsApp conversation", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not update conversation",
      },
      { status: 500 },
    );
  }
}
