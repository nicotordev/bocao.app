import type { Prisma } from "@/generated/prisma/client";
import type { RecordKitchenEventInput } from "@/lib/kitchen/events";
import { prisma } from "@/lib/prisma";
import {
  buildKitchenRealtimeEvent,
  publishKitchenEventAfterCommit,
  recordKitchenEventInTx,
} from "@/lib/realtime/event-log";

export type OrderMutationTxResult<T> = {
  value: T;
  pendingEvents: RecordKitchenEventInput[];
};

export async function executeOrderMutationWithEvents<T>(
  runInTx: (tx: Prisma.TransactionClient) => Promise<OrderMutationTxResult<T>>,
): Promise<T> {
  const { value, eventLogs, pendingEvents } = await prisma.$transaction(
    async (tx) => {
      const { value, pendingEvents } = await runInTx(tx);
      const eventLogs = await Promise.all(
        pendingEvents.map((eventInput) =>
          recordKitchenEventInTx(tx, eventInput),
        ),
      );

      return { value, eventLogs, pendingEvents };
    },
  );

  await Promise.all(
    eventLogs.map((log, index) => {
      const event = buildKitchenRealtimeEvent(pendingEvents[index]!, log.id);
      return publishKitchenEventAfterCommit(event, log.id);
    }),
  );

  return value;
}
