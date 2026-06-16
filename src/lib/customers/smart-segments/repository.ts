import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import type { CustomerSmartSegment } from "@/lib/customers/smart-segments/types";

export type CustomerSmartSegmentSnapshotKey = {
  restaurantId: string;
  locale: string;
};

export async function findCustomerSmartSegmentSnapshot(
  key: CustomerSmartSegmentSnapshotKey,
) {
  return prisma.customerSmartSegmentSnapshot.findUnique({
    where: {
      restaurantId_locale: key,
    },
  });
}

export async function upsertCustomerSmartSegmentSnapshot(
  key: CustomerSmartSegmentSnapshotKey,
  input: {
    segments: CustomerSmartSegment[];
    source: "ai" | "rules";
  },
) {
  return prisma.customerSmartSegmentSnapshot.upsert({
    where: {
      restaurantId_locale: key,
    },
    update: {
      segments: input.segments as Prisma.InputJsonValue,
      source: input.source,
      generatedAt: new Date(),
    },
    create: {
      ...key,
      segments: input.segments as Prisma.InputJsonValue,
      source: input.source,
    },
  });
}

export function parseStoredSmartSegments(value: unknown): CustomerSmartSegment[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(
    (item): item is CustomerSmartSegment =>
      typeof item === "object" &&
      item !== null &&
      "id" in item &&
      "name" in item &&
      "description" in item &&
      "customerIds" in item &&
      typeof item.id === "string" &&
      typeof item.name === "string" &&
      typeof item.description === "string" &&
      Array.isArray(item.customerIds) &&
      item.customerIds.every((entry: unknown) => typeof entry === "string"),
  );
}

export async function listRestaurantsForSmartSegmentsCron() {
  return prisma.restaurant.findMany({
    select: {
      id: true,
      name: true,
      timezone: true,
      currency: true,
      contentLocales: true,
    },
    orderBy: { createdAt: "asc" },
  });
}
