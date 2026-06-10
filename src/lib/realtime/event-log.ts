import type { Prisma } from "@/generated/prisma/client";
import { kitchenRedisChannel } from "@/lib/realtime/channels";
import type {
  AppRealtimeEvent,
  KitchenRealtimePayload,
} from "@/lib/realtime/types";
import { getRedisPublisher } from "@/lib/redis/client";
import { prisma } from "@/lib/prisma";

export type RecordKitchenEventInput = {
  tenantId: string;
  restaurantId: string;
  payload: KitchenRealtimePayload;
};

export function buildKitchenRealtimeEvent(
  input: RecordKitchenEventInput,
  eventLogId: string,
): AppRealtimeEvent {
  return {
    id: eventLogId,
    tenantId: input.tenantId,
    restaurantId: input.restaurantId,
    occurredAt: new Date().toISOString(),
    version: 1,
    domain: "kitchen",
    payload: input.payload,
  };
}

export async function recordKitchenEventInTx(
  tx: Prisma.TransactionClient,
  input: RecordKitchenEventInput,
) {
  return tx.appEventLog.create({
    data: {
      tenantId: input.tenantId,
      restaurantId: input.restaurantId,
      domain: "kitchen",
      type: input.payload.type,
      payload: input.payload,
    },
  });
}

export async function publishKitchenEventAfterCommit(
  event: AppRealtimeEvent,
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
      kitchenRedisChannel(event.restaurantId),
      JSON.stringify(event),
    );

    await prisma.appEventLog.update({
      where: { id: eventLogId },
      data: { publishedAt: new Date() },
    });
  } catch (error) {
    console.error("[kitchen-realtime] failed to publish event", {
      eventLogId,
      error,
    });
  }
}

export async function emitKitchenEventsAfterCommit(
  inputs: RecordKitchenEventInput[],
): Promise<void> {
  if (inputs.length === 0) {
    return;
  }

  const logs = await prisma.$transaction((tx) =>
    Promise.all(inputs.map((input) => recordKitchenEventInTx(tx, input))),
  );

  await Promise.all(
    logs.map((log, index) => {
      const event = buildKitchenRealtimeEvent(inputs[index]!, log.id);
      return publishKitchenEventAfterCommit(event, log.id);
    }),
  );
}

export async function emitKitchenEventAfterCommit(
  input: RecordKitchenEventInput,
): Promise<void> {
  await emitKitchenEventsAfterCommit([input]);
}
