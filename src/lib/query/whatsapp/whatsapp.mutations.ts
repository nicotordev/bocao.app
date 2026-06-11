"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ConversationsListFilters } from "@/lib/messaging/filters";
import {
  sendWhatsAppMessageRequest,
  updateWhatsAppConversationRequest,
} from "@/lib/query/whatsapp/whatsapp.api";
import { whatsappKeys } from "@/lib/query/whatsapp/whatsapp.keys";

export function useSendWhatsAppMessageMutation(
  restaurantId: string,
  filters?: ConversationsListFilters,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { conversationId: string; body: string }) =>
      sendWhatsAppMessageRequest(restaurantId, input),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: whatsappKeys.conversationsList(restaurantId, filters),
      });
      void queryClient.invalidateQueries({
        queryKey: whatsappKeys.conversation(
          restaurantId,
          variables.conversationId,
        ),
      });
    },
  });
}

export function useUpdateWhatsAppConversationMutation(
  restaurantId: string,
  filters?: ConversationsListFilters,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: {
      conversationId: string;
      status?: "open" | "closed";
      assignedToId?: string | null;
    }) =>
      updateWhatsAppConversationRequest(restaurantId, input.conversationId, {
        status: input.status,
        assignedToId: input.assignedToId,
      }),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: whatsappKeys.conversationsList(restaurantId, filters),
      });
      void queryClient.invalidateQueries({
        queryKey: whatsappKeys.conversation(
          restaurantId,
          variables.conversationId,
        ),
      });
    },
  });
}
