import type {
  Conversation,
  Message,
  MessageDirection,
  MessageStatus,
  MessageType,
} from "@/generated/prisma/client";
import type {
  ConversationDetail,
  ConversationListItem,
  MessageListItem,
} from "@/lib/messaging/types";
import type { NormalizedMessageType } from "@/lib/messaging/providers/types";

export function mapConversationListItem(
  conversation: Conversation,
): ConversationListItem {
  return {
    id: conversation.id,
    customerName: conversation.customerName,
    customerPhone: conversation.customerPhone,
    status: conversation.status,
    assignedToId: conversation.assignedToId,
    lastMessageAt: conversation.lastMessageAt?.toISOString() ?? null,
    lastMessageText: conversation.lastMessageText,
    createdAt: conversation.createdAt.toISOString(),
    updatedAt: conversation.updatedAt.toISOString(),
  };
}

export function mapConversationDetail(
  conversation: Conversation,
): ConversationDetail {
  return {
    ...mapConversationListItem(conversation),
    provider: conversation.provider,
    providerThreadId: conversation.providerThreadId,
  };
}

export function mapMessageListItem(message: Message): MessageListItem {
  return {
    id: message.id,
    conversationId: message.conversationId,
    direction: message.direction,
    type: message.type,
    status: message.status,
    body: message.body,
    fromPhone: message.fromPhone,
    toPhone: message.toPhone,
    sentAt: message.sentAt?.toISOString() ?? null,
    receivedAt: message.receivedAt?.toISOString() ?? null,
    createdAt: message.createdAt.toISOString(),
  };
}

export function mapNormalizedMessageType(
  type: NormalizedMessageType,
): MessageType {
  switch (type) {
    case "text":
      return "TEXT";
    case "image":
      return "IMAGE";
    case "audio":
      return "AUDIO";
    case "video":
      return "VIDEO";
    case "document":
      return "DOCUMENT";
    default:
      return "UNKNOWN";
  }
}

export function mapMetaStatusToMessageStatus(
  status: "sent" | "delivered" | "read" | "failed",
): MessageStatus {
  switch (status) {
    case "sent":
      return "SENT";
    case "delivered":
      return "DELIVERED";
    case "read":
      return "READ";
    case "failed":
      return "FAILED";
  }
}

export function mapUiStatusToDbStatus(
  status: "open" | "closed",
): Conversation["status"] {
  return status === "open" ? "OPEN" : "CLOSED";
}

export function mapMessageDirectionLabel(
  direction: MessageDirection,
): "inbound" | "outbound" {
  return direction === "INBOUND" ? "inbound" : "outbound";
}
