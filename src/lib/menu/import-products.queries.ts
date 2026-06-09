import "server-only";

import { resolveAccessibleSourceRestaurantIds } from "@/lib/menu/import-products.access";
import type {
  ImportableMenuCategory,
  ImportableMenuProduct,
  ImportableMenuResponse,
} from "@/lib/menu/import-products.types";
import { prisma } from "@/lib/prisma";

function mapProduct(item: {
  id: string;
  name: string;
  description: string | null;
  priceCents: number;
  images: string[];
  isAvailable: boolean;
}): ImportableMenuProduct {
  return {
    id: item.id,
    name: item.name,
    description: item.description,
    priceCents: item.priceCents,
    imageUrl: item.images[0] ?? null,
    isAvailable: item.isAvailable,
  };
}

export async function listImportableMenuCategories(
  userId: string,
  currentRestaurantId: string,
): Promise<ImportableMenuResponse> {
  const accessibleRestaurantIds = await resolveAccessibleSourceRestaurantIds(
    userId,
    currentRestaurantId,
  );

  if (accessibleRestaurantIds.length === 0) {
    return { categories: [] };
  }

  const categories = await prisma.menuCategory.findMany({
    where: {
      restaurantId: { in: accessibleRestaurantIds },
      isActive: true,
    },
    include: {
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
      items: {
        select: {
          id: true,
          name: true,
          description: true,
          priceCents: true,
          images: true,
          isAvailable: true,
        },
        orderBy: { sortOrder: "asc" },
      },
    },
    orderBy: [{ restaurantId: "asc" }, { sortOrder: "asc" }],
  });

  const mapped: ImportableMenuCategory[] = categories
    .filter((category) => category.items.length > 0)
    .map((category) => ({
      id: category.id,
      name: category.name,
      description: null,
      sourceRestaurantId: category.restaurant.id,
      sourceRestaurantName: category.restaurant.name,
      sourceOrganizationId: category.restaurant.organization.id,
      sourceOrganizationName: category.restaurant.organization.name,
      products: category.items.map(mapProduct),
    }));

  return { categories: mapped };
}
