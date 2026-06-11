import type { Prisma } from "@/generated/prisma/client";
import type { TeamEvent } from "@/lib/team/types";

export async function recordTeamEventInTx(
  tx: Prisma.TransactionClient,
  input: {
    organizationId: string;
    restaurantId?: string | null;
    type: TeamEvent;
    payload: Prisma.InputJsonValue;
  },
) {
  return tx.appEventLog.create({
    data: {
      tenantId: input.organizationId,
      restaurantId: input.restaurantId ?? null,
      domain: "team",
      type: input.type,
      payload: input.payload,
    },
  });
}
