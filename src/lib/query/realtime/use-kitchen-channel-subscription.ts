"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { fetchKitchenRealtimeToken } from "@/lib/query/kitchen/kitchen.api";
import { buildKitchenWebSocketUrl } from "@/lib/realtime/websocket-url";
import {
  isKitchenRealtimeEvent,
  type KitchenRealtimeConnectionState,
  type KitchenRealtimePayload,
} from "@/lib/realtime/types";

const INITIAL_BACKOFF_MS = 1_000;
const MAX_BACKOFF_MS = 30_000;

type UseKitchenChannelSubscriptionOptions = {
  restaurantId: string;
  enabled?: boolean;
  onPayload: (payload: KitchenRealtimePayload) => void;
  onConnected?: () => void;
};

export function useKitchenChannelSubscription({
  restaurantId,
  enabled = true,
  onPayload,
  onConnected,
}: UseKitchenChannelSubscriptionOptions) {
  const isActive = enabled && restaurantId.length > 0;
  const [liveConnectionState, setLiveConnectionState] =
    useState<KitchenRealtimeConnectionState>("disconnected");

  const socketRef = useRef<WebSocket | null>(null);
  const reconnectAttemptRef = useRef(0);
  const reconnectTimerRef = useRef<number | null>(null);
  const disposedRef = useRef(false);

  const connectionState: KitchenRealtimeConnectionState = isActive
    ? liveConnectionState
    : "disconnected";

  const clearReconnectTimer = useCallback(() => {
    if (reconnectTimerRef.current !== null) {
      window.clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
  }, []);

  const onPayloadRef = useRef(onPayload);
  onPayloadRef.current = onPayload;

  const onConnectedRef = useRef(onConnected);
  onConnectedRef.current = onConnected;

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
          buildKitchenWebSocketUrl(
            credentials.wsUrl,
            restaurantId,
            credentials.token,
          ),
        );
        socketRef.current = socket;

        socket.onopen = () => {
          if (disposedRef.current) {
            socket.close();
            return;
          }

          reconnectAttemptRef.current = 0;
          setLiveConnectionState("connected");
          onConnectedRef.current?.();
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
              onConnectedRef.current?.();
              return;
            }

            if (parsed.restaurantId !== restaurantId) {
              return;
            }

            onPayloadRef.current(parsed.payload);
          } catch {
            onConnectedRef.current?.();
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
            buildKitchenWebSocketUrl(
              credentials.wsUrl,
              restaurantId,
              credentials.token,
            ),
          );
          socketRef.current = socket;
          socket.onopen = () => {
            setLiveConnectionState("connected");
            onConnectedRef.current?.();
          };
        })
        .catch(() => {
          setLiveConnectionState("disconnected");
        });
    }, 0);
  }, [clearReconnectTimer, isActive, restaurantId]);

  return {
    connectionState,
    reconnect,
  };
}
