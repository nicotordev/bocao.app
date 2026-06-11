export type KitchenRealtimePayload =
  | { type: "order.created"; orderId: string }
  | { type: "order.confirmed"; orderId: string }
  | { type: "order.updated"; orderId: string }
  | { type: "order.cancelled"; orderId: string }
  | {
      type: "order.status.changed";
      orderId: string;
      fromStatus: string;
      toStatus: string;
    }
  | {
      type: "order.removed";
      orderId: string;
      reason: "cancelled" | "completed" | "not_kitchen_relevant";
    }
  | { type: "payment.created"; orderId: string; paymentId: string }
  | { type: "payment.updated"; orderId: string; paymentId: string }
  | {
      type: "kitchen.sync";
      reason: "reconnect" | "unknown_event" | "manual";
    };

export type MessagingRealtimePayload =
  | { type: "conversation.created"; conversationId: string }
  | { type: "conversation.updated"; conversationId: string }
  | { type: "message.received"; conversationId: string; messageId: string }
  | { type: "message.sent"; conversationId: string; messageId: string }
  | { type: "message.failed"; conversationId: string; messageId: string }
  | { type: "message.read"; conversationId: string; messageId: string }
  | { type: "conversation.assigned"; conversationId: string }
  | { type: "conversation.closed"; conversationId: string };

export type AppRealtimeEvent = {
  id: string;
  tenantId: string;
  restaurantId: string;
  occurredAt: string;
  version: number;
} & (
  | {
      domain: "kitchen";
      payload: KitchenRealtimePayload;
    }
  | {
      domain: "whatsapp";
      payload: MessagingRealtimePayload;
    }
);

export type KitchenRealtimeEvent = Extract<
  AppRealtimeEvent,
  { domain: "kitchen" }
>;

export type WhatsAppRealtimeEvent = Extract<
  AppRealtimeEvent,
  { domain: "whatsapp" }
>;

export type KitchenRealtimeConnectionState =
  | "connected"
  | "connecting"
  | "disconnected";

export type KitchenRealtimeTokenPayload = {
  sub: string;
  restaurantId: string;
  tenantId: string;
  scope: "kitchen:read";
  iat: number;
  exp: number;
};

function hasRealtimeEnvelope(
  value: unknown,
): value is Partial<AppRealtimeEvent> {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<AppRealtimeEvent>;

  return (
    typeof candidate.id === "string" &&
    typeof candidate.tenantId === "string" &&
    typeof candidate.restaurantId === "string" &&
    typeof candidate.occurredAt === "string" &&
    typeof candidate.version === "number" &&
    (candidate.domain === "kitchen" || candidate.domain === "whatsapp") &&
    candidate.payload !== undefined &&
    typeof candidate.payload === "object" &&
    candidate.payload !== null &&
    "type" in candidate.payload &&
    typeof (candidate.payload as { type: unknown }).type === "string"
  );
}

export function isAppRealtimeEvent(value: unknown): value is AppRealtimeEvent {
  return hasRealtimeEnvelope(value);
}

export function isKitchenRealtimeEvent(
  value: unknown,
): value is KitchenRealtimeEvent {
  return hasRealtimeEnvelope(value) && value.domain === "kitchen";
}

export function isWhatsAppRealtimeEvent(
  value: unknown,
): value is WhatsAppRealtimeEvent {
  return hasRealtimeEnvelope(value) && value.domain === "whatsapp";
}
