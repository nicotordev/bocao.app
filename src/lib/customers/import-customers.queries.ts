import "server-only";

import { resolveAccessibleSourceRestaurantIds } from "@/lib/customers/import-customers.access";
import type {
  ImportableCustomer,
  ImportableCustomersResponse,
} from "@/lib/customers/import-customers.types";
import { prisma } from "@/lib/prisma";

export async function listImportableCustomers(
  userId: string,
  currentRestaurantId: string,
): Promise<ImportableCustomersResponse> {
  const accessibleRestaurantIds = await resolveAccessibleSourceRestaurantIds(
    userId,
    currentRestaurantId,
  );

  if (accessibleRestaurantIds.length === 0) {
    return { customers: [] };
  }

  const customers = await prisma.customer.findMany({
    where: {
      restaurantId: { in: accessibleRestaurantIds },
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      documentId: true,
      avatar: true,
      restaurant: {
        select: {
          id: true,
          name: true,
          organizationId: true,
          organization: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
    orderBy: [{ restaurantId: "asc" }, { name: "asc" }],
  });

  const mapped: ImportableCustomer[] = customers.map((customer) => ({
    id: customer.id,
    name: customer.name,
    email: customer.email,
    phone: customer.phone,
    documentId: customer.documentId,
    avatar: customer.avatar,
    sourceRestaurantId: customer.restaurant.id,
    sourceRestaurantName: customer.restaurant.name,
    sourceOrganizationId: customer.restaurant.organization.id,
    sourceOrganizationName: customer.restaurant.organization.name,
  }));

  return { customers: mapped };
}
