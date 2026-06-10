import type {
  CreateSavedSegmentInput,
  CustomerSavedSegmentSummary,
} from "@/lib/customers/saved-segments.types";
import { prisma } from "@/lib/prisma";

function mapSavedSegmentSummary(segment: {
  id: string;
  name: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
  _count: { members: number };
}): CustomerSavedSegmentSummary {
  return {
    id: segment.id,
    name: segment.name,
    description: segment.description,
    customerCount: segment._count.members,
    createdAt: segment.createdAt.toISOString(),
    updatedAt: segment.updatedAt.toISOString(),
  };
}

async function assertCustomersBelongToRestaurant(
  restaurantId: string,
  customerIds: string[],
) {
  if (customerIds.length === 0) {
    return;
  }

  const uniqueIds = [...new Set(customerIds)];
  const count = await prisma.customer.count({
    where: {
      restaurantId,
      id: { in: uniqueIds },
    },
  });

  if (count !== uniqueIds.length) {
    throw new Error("CUSTOMER_NOT_FOUND");
  }
}

async function getSavedSegmentForRestaurant(
  restaurantId: string,
  segmentId: string,
) {
  return prisma.customerSavedSegment.findFirst({
    where: {
      id: segmentId,
      restaurantId,
    },
  });
}

export async function listSavedCustomerSegments(
  restaurantId: string,
): Promise<CustomerSavedSegmentSummary[]> {
  const segments = await prisma.customerSavedSegment.findMany({
    where: { restaurantId },
    orderBy: [{ name: "asc" }],
    include: {
      _count: {
        select: { members: true },
      },
    },
  });

  return segments.map(mapSavedSegmentSummary);
}

export async function createSavedCustomerSegment(
  restaurantId: string,
  input: CreateSavedSegmentInput,
): Promise<CustomerSavedSegmentSummary> {
  const customerIds = [...new Set(input.customerIds ?? [])];
  await assertCustomersBelongToRestaurant(restaurantId, customerIds);

  const segment = await prisma.customerSavedSegment.create({
    data: {
      restaurantId,
      name: input.name.trim(),
      description: input.description?.trim() || null,
      members:
        customerIds.length > 0
          ? {
              create: customerIds.map((customerId) => ({ customerId })),
            }
          : undefined,
    },
    include: {
      _count: {
        select: { members: true },
      },
    },
  });

  return mapSavedSegmentSummary(segment);
}

export async function addSavedCustomerSegmentMembers(
  restaurantId: string,
  segmentId: string,
  customerIds: string[],
): Promise<CustomerSavedSegmentSummary> {
  const segment = await getSavedSegmentForRestaurant(restaurantId, segmentId);

  if (!segment) {
    throw new Error("SEGMENT_NOT_FOUND");
  }

  const uniqueIds = [...new Set(customerIds)];
  await assertCustomersBelongToRestaurant(restaurantId, uniqueIds);

  if (uniqueIds.length > 0) {
    await prisma.customerSavedSegmentMember.createMany({
      data: uniqueIds.map((customerId) => ({
        segmentId,
        customerId,
      })),
      skipDuplicates: true,
    });
  }

  const updated = await prisma.customerSavedSegment.findUniqueOrThrow({
    where: { id: segmentId },
    include: {
      _count: {
        select: { members: true },
      },
    },
  });

  return mapSavedSegmentSummary(updated);
}
