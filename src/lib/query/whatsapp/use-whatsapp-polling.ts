"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import type { ConversationsListFilters } from "@/lib/messaging/filters";
import { whatsappKeys } from "@/lib/query/whatsapp/whatsapp.keys";

const POLL_INTERVAL_MS = 8_000;

type UseWhatsAppPollingOptions = {
  restaurantId: string;
  conversationId?: string;
  filters?: ConversationsListFilters;
  enabled?: boolean;
};

/**
 * Temporary polling fallback until a dedicated WhatsApp WebSocket gateway exists.
 * TODO: replace with Redis/WebSocket subscription on `restaurant:{restaurantId}:whatsapp`.
 */
export function useWhatsAppPolling({
  restaurantId,
  conversationId,
  filters,
  enabled = true,
}: UseWhatsAppPollingOptions) {
  const queryClient = useQueryClient();
  const isActive = enabled && restaurantId.length > 0;

  useEffect(() => {
    if (!isActive) {
      return;
    }

    const timer = window.setInterval(() => {
      void queryClient.invalidateQueries({
        queryKey: whatsappKeys.conversationsList(restaurantId, filters),
      });

      if (conversationId) {
        void queryClient.invalidateQueries({
          queryKey: whatsappKeys.conversation(restaurantId, conversationId),
        });
      }
    }, POLL_INTERVAL_MS);

    return () => {
      window.clearInterval(timer);
    };
  }, [conversationId, filters, isActive, queryClient, restaurantId]);
}
