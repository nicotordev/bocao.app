import type { Prisma } from "@/generated/prisma/client";
import { whatsappRedisChannel } from "@/lib/realtime/channels";
import type { MessagingRealtimePayload } from "@/lib/realtime/types";
import { getRedisPublisher } from "@/lib/redis/client";
import { prisma } from "@/lib/prisma";

export type RecordMessagingEventInput = {
  tenantId: string;
  restaurantId: string;
  payload: MessagingRealtimePayload;
};

export function buildMessagingRealtimeEvent(
  input: RecordMessagingEventInput,
  eventLogId: string,
) {
  return {
    id: eventLogId,
    tenantId: input.tenantId,
    restaurantId: input.restaurantId,
    occurredAt: new Date().toISOString(),
    version: 1 as const,
    domain: "whatsapp" as const,
    payload: input.payload,
  };
}

export async function recordMessagingEventInTx(
  tx: Prisma.TransactionClient,
  input: RecordMessagingEventInput,
) {
  return tx.appEventLog.create({
    data: {
      tenantId: input.tenantId,
      restaurantId: input.restaurantId,
      domain: "whatsapp",
      type: input.payload.type,
      payload: input.payload,
    },
  });
}

export async function publishMessagingEventAfterCommit(
  event: ReturnType<typeof buildMessagingRealtimeEvent>,
  eventLogId: string,
): Promise<void> {
  const publisher = getRedisPublisher();

  if (!publisher) {
    return;
  }

  try {
    if (publisher.status !== "ready") {
      await publisher.connect();
    }

    await publisher.publish(
      whatsappRedisChannel(event.restaurantId),
      JSON.stringify(event),
    );

    await prisma.appEventLog.update({
      where: { id: eventLogId },
      data: { publishedAt: new Date() },
    });
  } catch (error) {
    console.error("[whatsapp-realtime] failed to publish event", {
      eventLogId,
      error,
    });
  }
}

export async function emitMessagingEventsAfterCommit(
  inputs: RecordMessagingEventInput[],
): Promise<void> {
  if (inputs.length === 0) {
    return;
  }

  const logs = await prisma.$transaction((tx) =>
    Promise.all(inputs.map((input) => recordMessagingEventInTx(tx, input))),
  );

  await Promise.all(
    logs.map((log, index) => {
      const event = buildMessagingRealtimeEvent(inputs[index]!, log.id);
      return publishMessagingEventAfterCommit(event, log.id);
    }),
  );
}

export async function emitMessagingEventAfterCommit(
  input: RecordMessagingEventInput,
): Promise<void> {
  await emitMessagingEventsAfterCommit([input]);
}
