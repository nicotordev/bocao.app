"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { KitchenListFilters } from "@/lib/kitchen/list-filters";
import type { KitchenListResponse } from "@/lib/kitchen/repository";
import { fetchKitchenRealtimeToken } from "@/lib/query/kitchen/kitchen.api";
import { queryKeys } from "@/lib/query/query-keys";
import {
  isKitchenRealtimeEvent,
  type KitchenRealtimeConnectionState,
  type KitchenRealtimePayload,
} from "@/lib/realtime/types";

const INITIAL_BACKOFF_MS = 1_000;
const MAX_BACKOFF_MS = 30_000;

type UseKitchenRealtimeOptions = {
  restaurantId: string;
  filters?: KitchenListFilters;
  enabled?: boolean;
};

function buildWebSocketUrl(
  baseUrl: string,
  restaurantId: string,
  token: string,
) {
  const url = new URL(baseUrl);
  url.pathname = "/kitchen-ws";
  url.searchParams.set("restaurantId", restaurantId);
  url.searchParams.set("token", token);
  return url.toString();
}

function applyIncrementalKitchenPatch(
  current: KitchenListResponse | undefined,
  payload: KitchenRealtimePayload,
): KitchenListResponse | undefined {
  if (!current) {
    return current;
  }

  if (payload.type === "order.removed") {
    return {
      ...current,
      orders: current.orders.filter((order) => order.id !== payload.orderId),
      updatedAt: new Date().toISOString(),
    };
  }

  return current;
}

export function useKitchenRealtime({
  restaurantId,
  filters,
  enabled = true,
}: UseKitchenRealtimeOptions) {
  const queryClient = useQueryClient();
  const isActive = enabled && restaurantId.length > 0;
  const [liveConnectionState, setLiveConnectionState] =
    useState<KitchenRealtimeConnectionState>("disconnected");

  const socketRef = useRef<WebSocket | null>(null);
  const reconnectAttemptRef = useRef(0);
  const reconnectTimerRef = useRef<number | null>(null);
  const disposedRef = useRef(false);

  const listQueryKey = useMemo(
    () => queryKeys.kitchen.list(restaurantId, filters),
    [filters, restaurantId],
  );

  const connectionState: KitchenRealtimeConnectionState = isActive
    ? liveConnectionState
    : "disconnected";

  const clearReconnectTimer = useCallback(() => {
    if (reconnectTimerRef.current !== null) {
      window.clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
  }, []);

  const refetchKitchen = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: listQueryKey });
  }, [listQueryKey, queryClient]);

  const handleRealtimePayload = useCallback(
    (payload: KitchenRealtimePayload) => {
      if (payload.type === "kitchen.sync") {
        refetchKitchen();
        return;
      }

      if (payload.type === "order.removed") {
        queryClient.setQueryData<KitchenListResponse>(listQueryKey, (current) =>
          applyIncrementalKitchenPatch(current, payload),
        );
        return;
      }

      if (
        payload.type === "order.created" ||
        payload.type === "order.updated" ||
        payload.type === "order.status.changed"
      ) {
        refetchKitchen();
      }
    },
    [listQueryKey, queryClient, refetchKitchen],
  );

  const handleRealtimePayloadRef = useRef(handleRealtimePayload);
  handleRealtimePayloadRef.current = handleRealtimePayload;

  const refetchKitchenRef = useRef(refetchKitchen);
  refetchKitchenRef.current = refetchKitchen;

  useEffect(() => {
    if (!isActive) {
      return;
    }

    disposedRef.current = false;
    reconnectAttemptRef.current = 0;

    const scheduleReconnect = () => {
      if (disposedRef.current) {
        return;
      }

      const attempt = reconnectAttemptRef.current;
      const delay = Math.min(INITIAL_BACKOFF_MS * 2 ** attempt, MAX_BACKOFF_MS);
      reconnectAttemptRef.current = attempt + 1;
      reconnectTimerRef.current = window.setTimeout(() => {
        void openConnection();
      }, delay);
    };

    const openConnection = async () => {
      if (disposedRef.current) {
        return;
      }

      clearReconnectTimer();
      setLiveConnectionState("connecting");

      try {
        const credentials = await fetchKitchenRealtimeToken(restaurantId);

        if (disposedRef.current) {
          return;
        }

        if (!credentials.wsUrl) {
          setLiveConnectionState("disconnected");
          return;
        }

        const socket = new WebSocket(
          buildWebSocketUrl(credentials.wsUrl, restaurantId, credentials.token),
        );
        socketRef.current = socket;

        socket.onopen = () => {
          if (disposedRef.current) {
            socket.close();
            return;
          }

          reconnectAttemptRef.current = 0;
          setLiveConnectionState("connected");
          refetchKitchenRef.current();
        };

        socket.onmessage = (event) => {
          try {
            const parsed = JSON.parse(String(event.data)) as
              | { type?: string }
              | unknown;

            if (
              parsed &&
              typeof parsed === "object" &&
              "type" in parsed &&
              parsed.type === "ping"
            ) {
              socket.send(JSON.stringify({ type: "pong" }));
              return;
            }

            if (!isKitchenRealtimeEvent(parsed)) {
              refetchKitchenRef.current();
              return;
            }

            if (parsed.restaurantId !== restaurantId) {
              return;
            }

            handleRealtimePayloadRef.current(parsed.payload);
          } catch {
            refetchKitchenRef.current();
          }
        };

        socket.onclose = () => {
          socketRef.current = null;

          if (disposedRef.current) {
            return;
          }

          setLiveConnectionState("connecting");
          scheduleReconnect();
        };

        socket.onerror = () => {
          socket.close();
        };
      } catch {
        if (disposedRef.current) {
          return;
        }

        setLiveConnectionState("disconnected");
        scheduleReconnect();
      }
    };

    const startTimer = window.setTimeout(() => {
      void openConnection();
    }, 0);

    return () => {
      disposedRef.current = true;
      window.clearTimeout(startTimer);
      clearReconnectTimer();
      socketRef.current?.close();
      socketRef.current = null;
      setLiveConnectionState("disconnected");
    };
  }, [clearReconnectTimer, isActive, restaurantId]);

  const reconnect = useCallback(() => {
    if (!isActive || disposedRef.current) {
      return;
    }

    clearReconnectTimer();
    socketRef.current?.close();
    socketRef.current = null;
    reconnectAttemptRef.current = 0;
    setLiveConnectionState("connecting");
    window.setTimeout(() => {
      void fetchKitchenRealtimeToken(restaurantId)
        .then((credentials) => {
          if (!credentials.wsUrl || disposedRef.current) {
            setLiveConnectionState("disconnected");
            return;
          }

          const socket = new WebSocket(
            buildWebSocketUrl(
              credentials.wsUrl,
              restaurantId,
              credentials.token,
            ),
          );
          socketRef.current = socket;
          socket.onopen = () => {
            setLiveConnectionState("connected");
            refetchKitchen();
          };
        })
        .catch(() => {
          setLiveConnectionState("disconnected");
        });
    }, 0);
  }, [clearReconnectTimer, isActive, refetchKitchen, restaurantId]);

  return {
    connectionState,
    reconnect,
  };
}
