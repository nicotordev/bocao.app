import { createHmac, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import type {
  NormalizedIncomingMessage,
  NormalizedMessageType,
  SendOutboundMessageInput,
  SendOutboundMessageResult,
} from "@/lib/messaging/providers/types";

const metaWebhookSchema = z.object({
  object: z.string().optional(),
  entry: z
    .array(
      z.object({
        id: z.string().optional(),
        changes: z
          .array(
            z.object({
              field: z.string().optional(),
              value: z
                .object({
                  messaging_product: z.string().optional(),
                  metadata: z
                    .object({
                      display_phone_number: z.string().optional(),
                      phone_number_id: z.string().optional(),
                    })
                    .optional(),
                  contacts: z
                    .array(
                      z.object({
                        profile: z
                          .object({
                            name: z.string().optional(),
                          })
                          .optional(),
                        wa_id: z.string().optional(),
                      }),
                    )
                    .optional(),
                  messages: z
                    .array(
                      z.object({
                        id: z.string(),
                        from: z.string(),
                        timestamp: z.string().optional(),
                        type: z.string(),
                        text: z
                          .object({
                            body: z.string(),
                          })
                          .optional(),
                      }),
                    )
                    .optional(),
                  statuses: z
                    .array(
                      z.object({
                        id: z.string(),
                        status: z.string(),
                        timestamp: z.string().optional(),
                        recipient_id: z.string().optional(),
                      }),
                    )
                    .optional(),
                })
                .passthrough(),
            }),
          )
          .optional(),
      }),
    )
    .optional(),
});

export type MetaWebhookPayload = z.infer<typeof metaWebhookSchema>;

export type MetaStatusUpdate = {
  providerMessageId: string;
  status: "sent" | "delivered" | "read" | "failed";
  timestamp?: Date;
};

function mapMetaMessageType(type: string): NormalizedMessageType {
  switch (type) {
    case "text":
      return "text";
    case "image":
      return "image";
    case "audio":
      return "audio";
    case "video":
      return "video";
    case "document":
      return "document";
    default:
      return "unknown";
  }
}

function mapMetaStatus(
  status: string,
): "sent" | "delivered" | "read" | "failed" | null {
  switch (status) {
    case "sent":
      return "sent";
    case "delivered":
      return "delivered";
    case "read":
      return "read";
    case "failed":
      return "failed";
    default:
      return null;
  }
}

export function parseMetaWebhookPayload(raw: unknown): MetaWebhookPayload {
  return metaWebhookSchema.parse(raw);
}

export function normalizeMetaIncomingMessages(
  payload: MetaWebhookPayload,
): NormalizedIncomingMessage[] {
  const messages: NormalizedIncomingMessage[] = [];

  for (const entry of payload.entry ?? []) {
    for (const change of entry.changes ?? []) {
      const value = change.value;
      const toPhone = value.metadata?.display_phone_number;
      const contactName = value.contacts?.[0]?.profile?.name;

      for (const message of value.messages ?? []) {
        const receivedAt = message.timestamp
          ? new Date(Number(message.timestamp) * 1000)
          : new Date();

        messages.push({
          provider: "meta_whatsapp",
          providerMessageId: message.id,
          providerThreadId: message.from,
          fromPhone: message.from,
          toPhone,
          customerName: contactName,
          body: message.text?.body,
          messageType: mapMetaMessageType(message.type),
          receivedAt,
          rawPayload: message,
        });
      }
    }
  }

  return messages;
}

export function extractMetaStatusUpdates(
  payload: MetaWebhookPayload,
): MetaStatusUpdate[] {
  const updates: MetaStatusUpdate[] = [];

  for (const entry of payload.entry ?? []) {
    for (const change of entry.changes ?? []) {
      for (const status of change.value?.statuses ?? []) {
        const mapped = mapMetaStatus(status.status);

        if (!mapped) {
          continue;
        }

        updates.push({
          providerMessageId: status.id,
          status: mapped,
          timestamp: status.timestamp
            ? new Date(Number(status.timestamp) * 1000)
            : undefined,
        });
      }
    }
  }

  return updates;
}

export function verifyMetaWebhookSignature(
  rawBody: string,
  signatureHeader: string | null,
  appSecret: string,
): boolean {
  if (!signatureHeader?.startsWith("sha256=")) {
    return false;
  }

  const expected = createHmac("sha256", appSecret)
    .update(rawBody, "utf8")
    .digest("hex");
  const received = signatureHeader.slice("sha256=".length);

  if (expected.length !== received.length) {
    return false;
  }

  return timingSafeEqual(Buffer.from(expected), Buffer.from(received));
}

type MetaCredentials = {
  accessToken: string;
  phoneNumberId: string;
};

function getMetaCredentials(): MetaCredentials | null {
  const accessToken = process.env.META_WHATSAPP_ACCESS_TOKEN?.trim();
  const phoneNumberId = process.env.META_WHATSAPP_PHONE_NUMBER_ID?.trim();

  if (!accessToken || !phoneNumberId) {
    return null;
  }

  return { accessToken, phoneNumberId };
}

function normalizePhoneForMeta(phone: string): string {
  return phone.replace(/\D/g, "");
}

export async function sendMetaWhatsAppMessage(
  input: SendOutboundMessageInput,
): Promise<SendOutboundMessageResult> {
  const credentials = getMetaCredentials();

  if (!credentials) {
    throw new Error("Meta WhatsApp credentials are not configured");
  }

  const response = await fetch(
    `https://graph.facebook.com/v21.0/${credentials.phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${credentials.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: normalizePhoneForMeta(input.toPhone),
        type: "text",
        text: { body: input.body },
      }),
    },
  );

  const payload = (await response.json().catch(() => null)) as {
    messages?: Array<{ id: string }>;
    error?: { message?: string };
  } | null;

  if (!response.ok) {
    throw new Error(
      payload?.error?.message ?? "Failed to send WhatsApp message via Meta",
    );
  }

  const providerMessageId = payload?.messages?.[0]?.id;

  if (!providerMessageId) {
    throw new Error("Meta WhatsApp API did not return a message id");
  }

  return {
    providerMessageId,
    sentAt: new Date(),
    rawPayload: payload,
  };
}
