import {
  MessageDirection,
  MessageStatus,
  MessagingProvider,
} from "@/generated/prisma/client";
import { getWhatsAppProvider } from "@/lib/messaging/config";
import { emitMessagingEventsAfterCommit } from "@/lib/messaging/events";
import { sendMetaWhatsAppMessage } from "@/lib/messaging/providers/meta-whatsapp";
import { prisma } from "@/lib/prisma";

export async function sendWhatsAppMessage(input: {
  tenantId: string;
  restaurantId: string;
  conversationId: string;
  body: string;
  fromUserId: string;
}) {
  const conversation = await prisma.conversation.findFirst({
    where: {
      id: input.conversationId,
      restaurantId: input.restaurantId,
      tenantId: input.tenantId,
    },
  });

  if (!conversation) {
    throw new Error("Conversation not found");
  }

  const provider = getWhatsAppProvider();

  if (provider !== "meta") {
    throw new Error("Only Meta WhatsApp provider is supported in this iteration");
  }

  const sendResult = await sendMetaWhatsAppMessage({
    toPhone: conversation.customerPhone,
    body: input.body,
  });

  const message = await prisma.$transaction(async (tx) => {
    const created = await tx.message.create({
      data: {
        tenantId: input.tenantId,
        restaurantId: input.restaurantId,
        conversationId: conversation.id,
        provider: MessagingProvider.META_WHATSAPP,
        providerMessageId: sendResult.providerMessageId,
        direction: MessageDirection.OUTBOUND,
        type: "TEXT",
        status: MessageStatus.SENT,
        fromPhone: null,
        toPhone: conversation.customerPhone,
        body: input.body,
        rawPayload: sendResult.rawPayload as object,
        sentAt: sendResult.sentAt,
      },
    });

    await tx.conversation.update({
      where: { id: conversation.id },
      data: {
        lastMessageAt: sendResult.sentAt,
        lastMessageText: input.body,
        status: "OPEN",
        assignedToId: conversation.assignedToId ?? input.fromUserId,
      },
    });

    return created;
  });

  await emitMessagingEventsAfterCommit([
    {
      tenantId: input.tenantId,
      restaurantId: input.restaurantId,
      payload: {
        type: "message.sent",
        conversationId: conversation.id,
        messageId: message.id,
      },
    },
    {
      tenantId: input.tenantId,
      restaurantId: input.restaurantId,
      payload: {
        type: "conversation.updated",
        conversationId: conversation.id,
      },
    },
  ]);

  return message;
}
