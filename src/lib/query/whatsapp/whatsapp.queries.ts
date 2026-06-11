import { queryOptions } from "@tanstack/react-query";
import type { ConversationsListFilters } from "@/lib/messaging/filters";
import {
  fetchWhatsAppAssignableMembers,
  fetchWhatsAppConversation,
  fetchWhatsAppConversations,
} from "@/lib/query/whatsapp/whatsapp.api";
import { whatsappKeys } from "@/lib/query/whatsapp/whatsapp.keys";

export function whatsappConversationsQueryOptions(
  restaurantId: string,
  filters?: ConversationsListFilters,
) {
  return queryOptions({
    queryKey: whatsappKeys.conversationsList(restaurantId, filters),
    queryFn: () => fetchWhatsAppConversations(restaurantId, filters),
    enabled: restaurantId.length > 0,
  });
}

export function whatsappConversationQueryOptions(
  restaurantId: string,
  conversationId: string,
) {
  return queryOptions({
    queryKey: whatsappKeys.conversation(restaurantId, conversationId),
    queryFn: () => fetchWhatsAppConversation(restaurantId, conversationId),
    enabled: restaurantId.length > 0 && conversationId.length > 0,
  });
}

export function whatsappMembersQueryOptions(restaurantId: string) {
  return queryOptions({
    queryKey: whatsappKeys.members(restaurantId),
    queryFn: () => fetchWhatsAppAssignableMembers(restaurantId),
    enabled: restaurantId.length > 0,
  });
}
