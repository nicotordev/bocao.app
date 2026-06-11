import type { ConversationsListFilters } from "@/lib/messaging/filters";

export const whatsappKeys = {
  all: ["whatsapp"] as const,
  conversations: () => [...whatsappKeys.all, "conversations"] as const,
  conversationsList: (
    restaurantId: string,
    filters?: ConversationsListFilters,
  ) =>
    [...whatsappKeys.conversations(), restaurantId, filters ?? {}] as const,
  conversation: (restaurantId: string, conversationId: string) =>
    [...whatsappKeys.all, "conversation", restaurantId, conversationId] as const,
  messages: (restaurantId: string, conversationId: string) =>
    [...whatsappKeys.all, "messages", restaurantId, conversationId] as const,
  members: (restaurantId: string) =>
    [...whatsappKeys.all, "members", restaurantId] as const,
};
