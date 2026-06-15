import { NextResponse } from "next/server";
import { resolveWebhookRestaurant } from "@/lib/messaging/config";
import type { NormalizedIncomingMessage } from "@/lib/messaging/providers/types";
import {
  extractMetaStatusUpdates,
  normalizeMetaIncomingMessages,
  parseMetaWebhookPayload,
  verifyMetaWebhookSignature,
} from "@/lib/messaging/providers/meta-whatsapp";
import {
  processIncomingMessage,
  processMessageStatusUpdates,
} from "@/lib/messaging/process-incoming";

function groupIncomingMessagesByPhoneNumberId(
  messages: NormalizedIncomingMessage[],
) {
  const grouped = new Map<string, NormalizedIncomingMessage[]>();

  for (const message of messages) {
    const phoneNumberId = message.providerPhoneNumberId?.trim();

    if (!phoneNumberId) {
      console.warn(
        "[whatsapp-webhook] skipped message: missing phone_number_id",
        { providerMessageId: message.providerMessageId },
      );
      continue;
    }

    const bucket = grouped.get(phoneNumberId) ?? [];
    bucket.push(message);
    grouped.set(phoneNumberId, bucket);
  }

  return grouped;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");
  const verifyToken = process.env.META_WHATSAPP_VERIFY_TOKEN?.trim();

  if (
    mode === "subscribe" &&
    token &&
    verifyToken &&
    token === verifyToken &&
    challenge
  ) {
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const appSecret = process.env.META_WHATSAPP_APP_SECRET?.trim();

  if (!appSecret) {
    console.error(
      "[whatsapp-webhook] META_WHATSAPP_APP_SECRET is not configured",
    );
    return NextResponse.json(
      { error: "Webhook not configured" },
      { status: 503 },
    );
  }

  const signature = request.headers.get("x-hub-signature-256");
  const valid = verifyMetaWebhookSignature(rawBody, signature, appSecret);

  if (!valid) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: unknown;

  try {
    payload = JSON.parse(rawBody) as unknown;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  let parsed;

  try {
    parsed = parseMetaWebhookPayload(payload);
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const incomingMessages = normalizeMetaIncomingMessages(parsed);
  const statusUpdates = extractMetaStatusUpdates(parsed);
  const messagesByPhoneNumberId =
    groupIncomingMessagesByPhoneNumberId(incomingMessages);

  try {
    const processingTasks: Promise<unknown>[] = [
      processMessageStatusUpdates(statusUpdates),
    ];

    for (const [phoneNumberId, messages] of messagesByPhoneNumberId) {
      const scope = await resolveWebhookRestaurant({ phoneNumberId });

      if (!scope) {
        console.warn(
          "[whatsapp-webhook] skipped messages: restaurant not configured",
          { phoneNumberId, messageCount: messages.length },
        );
        continue;
      }

      processingTasks.push(
        ...messages.map((message) =>
          processIncomingMessage({
            tenantId: scope.tenantId,
            restaurantId: scope.restaurantId,
            message,
          }),
        ),
      );
    }

    await Promise.all(processingTasks);
  } catch (error) {
    console.error("[whatsapp-webhook] failed to process event", error);
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
