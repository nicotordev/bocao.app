import type {
  BulkCustomerTagsInput,
  CreateCustomerTagInput,
  CustomerTagSummary,
} from "@/lib/customers/tags.types";
import { prisma } from "@/lib/prisma";

function mapCustomerTag(tag: {
  id: string;
  name: string;
  color: string | null;
}): CustomerTagSummary {
  return {
    id: tag.id,
    name: tag.name,
    color: tag.color,
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

async function assertTagsBelongToOrganization(
  organizationId: string,
  tagIds: string[],
) {
  if (tagIds.length === 0) {
    return;
  }

  const uniqueIds = [...new Set(tagIds)];
  const count = await prisma.customerTag.count({
    where: {
      organizationId,
      id: { in: uniqueIds },
    },
  });

  if (count !== uniqueIds.length) {
    throw new Error("TAG_NOT_FOUND");
  }
}

export async function listCustomerTags(
  organizationId: string,
): Promise<CustomerTagSummary[]> {
  const tags = await prisma.customerTag.findMany({
    where: { organizationId },
    orderBy: [{ name: "asc" }],
    select: {
      id: true,
      name: true,
      color: true,
    },
  });

  return tags.map(mapCustomerTag);
}

export async function createCustomerTag(
  organizationId: string,
  input: CreateCustomerTagInput,
): Promise<CustomerTagSummary> {
  const tag = await prisma.customerTag.create({
    data: {
      organizationId,
      name: input.name.trim(),
      color: input.color?.trim() || null,
    },
    select: {
      id: true,
      name: true,
      color: true,
    },
  });

  return mapCustomerTag(tag);
}

export async function syncCustomerTagAssignments(
  customerId: string,
  organizationId: string,
  tagIds: string[],
) {
  const uniqueTagIds = [...new Set(tagIds)];
  await assertTagsBelongToOrganization(organizationId, uniqueTagIds);

  await prisma.$transaction(async (tx) => {
    await tx.customerTagAssignment.deleteMany({
      where: { customerId },
    });

    if (uniqueTagIds.length > 0) {
      await tx.customerTagAssignment.createMany({
        data: uniqueTagIds.map((tagId) => ({
          customerId,
          tagId,
        })),
        skipDuplicates: true,
      });
    }
  });
}

export async function bulkUpdateCustomerTags(
  restaurantId: string,
  organizationId: string,
  input: BulkCustomerTagsInput,
): Promise<number> {
  const customerIds = [...new Set(input.customerIds)];
  const tagIds = [...new Set(input.tagIds)];

  await assertCustomersBelongToRestaurant(restaurantId, customerIds);
  await assertTagsBelongToOrganization(organizationId, tagIds);

  if (input.operation === "add") {
    const result = await prisma.customerTagAssignment.createMany({
      data: customerIds.flatMap((customerId) =>
        tagIds.map((tagId) => ({
          customerId,
          tagId,
        })),
      ),
      skipDuplicates: true,
    });

    return result.count;
  }

  const result = await prisma.customerTagAssignment.deleteMany({
    where: {
      customerId: { in: customerIds },
      tagId: { in: tagIds },
    },
  });

  return result.count;
}
