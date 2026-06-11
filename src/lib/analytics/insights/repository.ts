import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import type { AnalyticsInsight } from "@/lib/analytics/types";

export type AnalyticsInsightSnapshotKey = {
  restaurantId: string;
  locale: string;
  preset: string;
  channel: string;
  status: string;
};

export async function findAnalyticsInsightSnapshot(
  key: AnalyticsInsightSnapshotKey,
) {
  return prisma.analyticsInsightSnapshot.findUnique({
    where: {
      restaurantId_locale_preset_channel_status: key,
    },
  });
}

export async function upsertAnalyticsInsightSnapshot(
  key: AnalyticsInsightSnapshotKey,
  input: {
    insights: AnalyticsInsight[];
    source: "ai" | "rules";
  },
) {
  return prisma.analyticsInsightSnapshot.upsert({
    where: {
      restaurantId_locale_preset_channel_status: key,
    },
    update: {
      insights: input.insights as Prisma.InputJsonValue,
      source: input.source,
      generatedAt: new Date(),
    },
    create: {
      ...key,
      insights: input.insights as Prisma.InputJsonValue,
      source: input.source,
    },
  });
}

export function parseStoredInsights(value: unknown): AnalyticsInsight[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(
    (item): item is AnalyticsInsight =>
      typeof item === "object" &&
      item !== null &&
      "id" in item &&
      "message" in item &&
      typeof item.id === "string" &&
      typeof item.message === "string",
  );
}

export async function listRestaurantsForInsightsCron() {
  return prisma.restaurant.findMany({
    select: {
      id: true,
      name: true,
      organizationId: true,
      timezone: true,
      currency: true,
      contentLocales: true,
    },
    orderBy: { createdAt: "asc" },
  });
}
