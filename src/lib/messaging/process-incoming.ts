import {
  MessageDirection,
  MessageStatus,
  MessagingProvider,
} from "@/generated/prisma/client";
import {
  mapMetaStatusToMessageStatus,
  mapNormalizedMessageType,
} from "@/lib/messaging/mappers";
import type { NormalizedIncomingMessage } from "@/lib/messaging/providers/types";
import type { MetaStatusUpdate } from "@/lib/messaging/providers/meta-whatsapp";
import { emitMessagingEventsAfterCommit } from "@/lib/messaging/events";
import { prisma } from "@/lib/prisma";

function mapProviderSlug(provider: NormalizedIncomingMessage["provider"]) {
  switch (provider) {
    case "meta_whatsapp":
      return MessagingProvider.META_WHATSAPP;
    case "twilio_whatsapp":
      return MessagingProvider.TWILIO_WHATSAPP;
  }
}

export async function processIncomingMessage(input: {
  tenantId: string;
  restaurantId: string;
  message: NormalizedIncomingMessage;
}) {
  const provider = mapProviderSlug(input.message.provider);

  const result = await prisma.$transaction(async (tx) => {
    const existing = await tx.message.findFirst({
      where: {
        provider,
        providerMessageId: input.message.providerMessageId,
      },
      select: { id: true, conversationId: true },
    });

    if (existing) {
      return {
        duplicate: true as const,
        conversationId: existing.conversationId,
        messageId: existing.id,
      };
    }

    let conversation = await tx.conversation.findFirst({
      where: {
        restaurantId: input.restaurantId,
        provider,
        customerPhone: input.message.fromPhone,
      },
    });

    const isNewConversation = !conversation;
    const previewText = input.message.body ?? `[${input.message.messageType}]`;

    if (!conversation) {
      conversation = await tx.conversation.create({
        data: {
          tenantId: input.tenantId,
          restaurantId: input.restaurantId,
          provider,
          providerThreadId: input.message.providerThreadId,
          customerPhone: input.message.fromPhone,
          customerName: input.message.customerName,
          status: "OPEN",
          lastMessageAt: input.message.receivedAt,
          lastMessageText: previewText,
        },
      });
    } else {
      conversation = await tx.conversation.update({
        where: { id: conversation.id },
        data: {
          customerName: input.message.customerName ?? conversation.customerName,
          providerThreadId:
            input.message.providerThreadId ?? conversation.providerThreadId,
          lastMessageAt: input.message.receivedAt,
          lastMessageText: previewText,
          status: "OPEN",
        },
      });
    }

    const message = await tx.message.create({
      data: {
        tenantId: input.tenantId,
        restaurantId: input.restaurantId,
        conversationId: conversation.id,
        provider,
        providerMessageId: input.message.providerMessageId,
        direction: MessageDirection.INBOUND,
        type: mapNormalizedMessageType(input.message.messageType),
        status: MessageStatus.RECEIVED,
        fromPhone: input.message.fromPhone,
        toPhone: input.message.toPhone,
        body: input.message.body,
        rawPayload: input.message.rawPayload as object,
        receivedAt: input.message.receivedAt,
      },
    });

    return {
      duplicate: false as const,
      isNewConversation,
      conversationId: conversation.id,
      messageId: message.id,
    };
  });

  if (result.duplicate) {
    return result;
  }

  await emitMessagingEventsAfterCommit([
    {
      tenantId: input.tenantId,
      restaurantId: input.restaurantId,
      payload: result.isNewConversation
        ? {
            type: "conversation.created",
            conversationId: result.conversationId,
          }
        : {
            type: "conversation.updated",
            conversationId: result.conversationId,
          },
    },
    {
      tenantId: input.tenantId,
      restaurantId: input.restaurantId,
      payload: {
        type: "message.received",
        conversationId: result.conversationId,
        messageId: result.messageId,
      },
    },
  ]);

  return result;
}

export async function processMessageStatusUpdates(
  updates: MetaStatusUpdate[],
  provider: MessagingProvider = MessagingProvider.META_WHATSAPP,
) {
  for (const update of updates) {
    const message = await prisma.message.findFirst({
      where: {
        provider,
        providerMessageId: update.providerMessageId,
      },
      select: {
        id: true,
        conversationId: true,
        restaurantId: true,
        tenantId: true,
      },
    });

    if (!message) {
      continue;
    }

    const status = mapMetaStatusToMessageStatus(update.status);

    await prisma.message.update({
      where: { id: message.id },
      data: {
        status,
        sentAt: update.timestamp ?? undefined,
      },
    });

    const eventType =
      update.status === "failed"
        ? ("message.failed" as const)
        : update.status === "read"
          ? ("message.read" as const)
          : update.status === "sent"
            ? ("message.sent" as const)
            : ("conversation.updated" as const);

    await emitMessagingEventsAfterCommit([
      {
        tenantId: message.tenantId,
        restaurantId: message.restaurantId,
        payload:
          eventType === "conversation.updated"
            ? {
                type: eventType,
                conversationId: message.conversationId,
              }
            : {
                type: eventType,
                conversationId: message.conversationId,
                messageId: message.id,
              },
      },
    ]);
  }
}
