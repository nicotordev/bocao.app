import type { ConversationsListFilters } from "@/lib/messaging/filters";
import type {
  AssignableMember,
  ConversationDetail,
  ConversationMessagesResponse,
  ConversationsListResponse,
  MessageListItem,
} from "@/lib/messaging/types";
import { apiRequest } from "@/lib/query/api-client";

function buildConversationsSearchParams(filters?: ConversationsListFilters) {
  const params = new URLSearchParams();

  if (filters?.status) {
    params.set("status", filters.status);
  }

  if (filters?.assignment) {
    params.set("assignment", filters.assignment);
  }

  if (filters?.search) {
    params.set("search", filters.search);
  }

  if (filters?.conversationId) {
    params.set("conversationId", filters.conversationId);
  }

  return params;
}

export async function fetchWhatsAppConversations(
  restaurantId: string,
  filters?: ConversationsListFilters,
): Promise<ConversationsListResponse> {
  const params = buildConversationsSearchParams(filters);
  const query = params.toString();

  return apiRequest<ConversationsListResponse>(
    query.length > 0
      ? `/api/restaurants/${restaurantId}/whatsapp/conversations?${query}`
      : `/api/restaurants/${restaurantId}/whatsapp/conversations`,
  );
}

export async function fetchWhatsAppConversation(
  restaurantId: string,
  conversationId: string,
): Promise<ConversationMessagesResponse> {
  return apiRequest<ConversationMessagesResponse>(
    `/api/restaurants/${restaurantId}/whatsapp/conversations/${encodeURIComponent(conversationId)}`,
  );
}

export async function sendWhatsAppMessageRequest(
  restaurantId: string,
  input: { conversationId: string; body: string },
): Promise<{ message: MessageListItem }> {
  return apiRequest<{ message: MessageListItem }>(
    `/api/restaurants/${restaurantId}/whatsapp/messages`,
    {
      method: "POST",
      body: input,
    },
  );
}

export async function updateWhatsAppConversationRequest(
  restaurantId: string,
  conversationId: string,
  input: { status?: "open" | "closed"; assignedToId?: string | null },
): Promise<{ conversation: ConversationDetail }> {
  return apiRequest<{ conversation: ConversationDetail }>(
    `/api/restaurants/${restaurantId}/whatsapp/conversations/${encodeURIComponent(conversationId)}`,
    {
      method: "PATCH",
      body: input,
    },
  );
}

export async function fetchWhatsAppAssignableMembers(
  restaurantId: string,
): Promise<{ members: AssignableMember[] }> {
  return apiRequest<{ members: AssignableMember[] }>(
    `/api/restaurants/${restaurantId}/whatsapp/members`,
  );
}
