import type { Prisma } from "@/generated/prisma/client";
import { z } from "zod";
import {
  parsePaginationParams,
  type PaginationParams,
  paginationQuerySchema,
} from "@/lib/pagination";
import { DB_TRANSLATION_ENTITY } from "@/lib/translations/types";
import { prisma } from "@/lib/prisma";

export type MenuListFilters = {
  search?: string;
  categoryId?: string;
  showUnavailable?: boolean;
} & PaginationParams;

export const menuListQuerySchema = z
  .object({
    search: z.string().optional(),
    category: z.string().optional(),
    showUnavailable: z.enum(["true", "false"]).optional(),
  })
  .merge(paginationQuerySchema);

export function parseMenuListSearchParams(
  searchParams: Record<string, string | string[] | undefined>,
): MenuListFilters {
  const getValue = (key: string) => {
    const value = searchParams[key];
    return Array.isArray(value) ? value[0] : value;
  };

  const parsed = menuListQuerySchema.safeParse({
    search: getValue("search"),
    category: getValue("category"),
    showUnavailable: getValue("showUnavailable"),
    page: getValue("page"),
    pageSize: getValue("pageSize"),
  });

  if (!parsed.success) {
    return {
      showUnavailable: true,
      ...parsePaginationParams(searchParams),
    };
  }

  return {
    search: parsed.data.search,
    categoryId:
      parsed.data.category && parsed.data.category !== "all"
        ? parsed.data.category
        : undefined,
    showUnavailable: parsed.data.showUnavailable !== "false",
    page: parsed.data.page,
    pageSize: parsed.data.pageSize,
  };
}

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

export function hasActiveMenuFilters(filters: MenuListFilters) {
  return Boolean(
    filters.search?.trim() ||
    filters.categoryId ||
    filters.showUnavailable === false ||
    filters.page > 1,
  );
}
