import type {
  ConversationStatus,
  MessageDirection,
  MessageStatus,
  MessageType,
  MessagingProvider,
} from "@/generated/prisma/client";

export type MessagingEventType =
  | "conversation.created"
  | "conversation.updated"
  | "message.received"
  | "message.sent"
  | "message.failed"
  | "message.read"
  | "conversation.assigned"
  | "conversation.closed";

export type MessagingEventPayload = {
  type: MessagingEventType;
  conversationId: string;
  messageId?: string;
};

export type ConversationListItem = {
  id: string;
  customerName: string | null;
  customerPhone: string;
  status: ConversationStatus;
  assignedToId: string | null;
  lastMessageAt: string | null;
  lastMessageText: string | null;
  createdAt: string;
  updatedAt: string;
};

export type MessageListItem = {
  id: string;
  conversationId: string;
  direction: MessageDirection;
  type: MessageType;
  status: MessageStatus;
  body: string | null;
  fromPhone: string | null;
  toPhone: string | null;
  sentAt: string | null;
  receivedAt: string | null;
  createdAt: string;
};

export type ConversationDetail = ConversationListItem & {
  provider: MessagingProvider;
  providerThreadId: string | null;
};

export type ConversationsListResponse = {
  conversations: ConversationListItem[];
  updatedAt: string;
};

export type ConversationMessagesResponse = {
  conversation: ConversationDetail;
  messages: MessageListItem[];
  updatedAt: string;
};

export type AssignableMember = {
  id: string;
  name: string;
};
