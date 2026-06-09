import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import type { PaginationParams } from "@/lib/pagination";
import { DB_TRANSLATION_ENTITY } from "@/lib/translations/types";
import type { MenuListFilters } from "@/lib/menu/filter-utils";
import { prisma } from "@/lib/prisma";

export async function buildMenuItemPrismaWhere(
  restaurantId: string,
  filters?: Omit<MenuListFilters, keyof PaginationParams>,
): Promise<Prisma.MenuItemWhereInput> {
  const where: Prisma.MenuItemWhereInput = { restaurantId };

  if (!filters) {
    return where;
  }

  if (filters.categoryId) {
    where.categoryId = filters.categoryId;
  }

  if (filters.showUnavailable === false) {
    where.isAvailable = true;
  }

  const search = filters.search?.trim();
  if (search) {
    const translationMatches = await prisma.dbTranslation.findMany({
      where: {
        restaurantId,
        entityType: DB_TRANSLATION_ENTITY.MENU_ITEM,
        value: { contains: search, mode: "insensitive" },
      },
      select: { entityKey: true },
      distinct: ["entityKey"],
    });

    const translatedItemIds = translationMatches.map((row) => row.entityKey);

    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
      {
        category: {
          name: { contains: search, mode: "insensitive" },
        },
      },
      ...(translatedItemIds.length > 0
        ? [{ id: { in: translatedItemIds } }]
        : []),
    ];
  }

  return where;
}
