import type { ServerWebSocket } from "bun";
import { KITCHEN_REDIS_PATTERN } from "../../src/lib/realtime/channels";
import { verifyKitchenRealtimeToken } from "../../src/lib/realtime/jwt";
import type { AppRealtimeEvent } from "../../src/lib/realtime/types";
import { createRedisSubscriber } from "../../src/lib/redis/client";

type KitchenSocketData = {
  restaurantId: string;
  userId: string;
  tenantId: string;
};

const HEARTBEAT_INTERVAL_MS = 30_000;
const HEARTBEAT_TIMEOUT_MS = 45_000;

const rooms = new Map<string, Set<ServerWebSocket<KitchenSocketData>>>();
const socketHeartbeats = new Map<ServerWebSocket<KitchenSocketData>, number>();

function addSocketToRoom(
  restaurantId: string,
  socket: ServerWebSocket<KitchenSocketData>,
) {
  const room = rooms.get(restaurantId) ?? new Set();
  room.add(socket);
  rooms.set(restaurantId, room);
}

function removeSocketFromRoom(
  restaurantId: string,
  socket: ServerWebSocket<KitchenSocketData>,
) {
  const room = rooms.get(restaurantId);

  if (!room) {
    return;
  }

  room.delete(socket);

  if (room.size === 0) {
    rooms.delete(restaurantId);
  }
}

function broadcastToRestaurant(restaurantId: string, message: string) {
  const room = rooms.get(restaurantId);

  if (!room) {
    return;
  }

  for (const socket of room) {
    socket.send(message);
  }
}

function parseRealtimeEvent(message: string): AppRealtimeEvent | null {
  try {
    const parsed = JSON.parse(message) as AppRealtimeEvent;

    if (
      typeof parsed.id !== "string" ||
      typeof parsed.restaurantId !== "string" ||
      parsed.domain !== "kitchen"
    ) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

function extractChannelRestaurantId(channel: string): string | null {
  if (!channel.startsWith("kitchen:")) {
    return null;
  }

  const restaurantId = channel.slice("kitchen:".length);
  return restaurantId.length > 0 ? restaurantId : null;
}

const port = Number(process.env.KITCHEN_WS_PORT ?? "3001");

const subscriber = createRedisSubscriber();

if (subscriber) {
  void subscriber
    .psubscribe(KITCHEN_REDIS_PATTERN)
    .then(() => {
      subscriber.on("pmessage", (_pattern, channel, message) => {
        const restaurantId = extractChannelRestaurantId(channel);

        if (!restaurantId) {
          return;
        }

        broadcastToRestaurant(restaurantId, message);
      });
    })
    .catch((error) => {
      console.error("[kitchen-realtime] redis subscribe failed", error);
    });
} else {
  console.warn(
    "[kitchen-realtime] REDIS_URL is not configured; gateway will not receive events",
  );
}

setInterval(() => {
  const now = Date.now();

  for (const [socket, lastPongAt] of socketHeartbeats) {
    if (now - lastPongAt > HEARTBEAT_TIMEOUT_MS) {
      socket.close(4000, "heartbeat timeout");
      continue;
    }

    socket.send(JSON.stringify({ type: "ping", at: new Date().toISOString() }));
  }
}, HEARTBEAT_INTERVAL_MS);

const server = Bun.serve<KitchenSocketData>({
  port,
  fetch(request, serverInstance) {
    const url = new URL(request.url);

    if (url.pathname !== "/kitchen-ws") {
      return new Response("Not found", { status: 404 });
    }

    const token = url.searchParams.get("token")?.trim();
    const restaurantId = url.searchParams.get("restaurantId")?.trim();

    if (!token || !restaurantId) {
      return new Response("Missing token or restaurantId", { status: 400 });
    }

    const payload = verifyKitchenRealtimeToken(token);

    if (!payload || payload.restaurantId !== restaurantId) {
      return new Response("Unauthorized", { status: 401 });
    }

    const upgraded = serverInstance.upgrade(request, {
      data: {
        restaurantId,
        userId: payload.sub,
        tenantId: payload.tenantId,
      },
    });

    if (!upgraded) {
      return new Response("WebSocket upgrade failed", { status: 500 });
    }

    return undefined;
  },
  websocket: {
    open(socket) {
      addSocketToRoom(socket.data.restaurantId, socket);
      socketHeartbeats.set(socket, Date.now());
      socket.send(
        JSON.stringify({
          type: "connected",
          restaurantId: socket.data.restaurantId,
        }),
      );
    },
    message(socket, message) {
      if (typeof message !== "string") {
        return;
      }

      try {
        const parsed = JSON.parse(message) as { type?: string };

        if (parsed.type === "pong") {
          socketHeartbeats.set(socket, Date.now());
        }
      } catch {
        // ignore malformed client messages
      }
    },
    close(socket) {
      removeSocketFromRoom(socket.data.restaurantId, socket);
      socketHeartbeats.delete(socket);
    },
  },
});

console.log(
  `[kitchen-realtime] listening on ws://localhost:${server.port}/kitchen-ws`,
);

export { parseRealtimeEvent };
