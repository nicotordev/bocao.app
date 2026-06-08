import type { Prisma } from "@/generated/prisma/client";
import { syncMenuCustomTagsFromItemTags } from "@/lib/menu/custom-tags";
import type {
  MenuCategoryRecord,
  MenuItemOption,
  MenuItemRecord,
} from "@/lib/menu/types";
import type { MenuItemTag } from "@/lib/menu/tag-types";
import {
  normalizeMenuItemTagsForStorage,
  parseMenuItemTags,
} from "@/lib/menu/tag-utils";
import { prisma } from "@/lib/prisma";

function mapMenuItemRecord(item: {
  id: string;
  name: string;
  description: string | null;
  priceCents: number;
  sortOrder: number;
  tags: Prisma.JsonValue;
  images: string[];
  isAvailable: boolean;
  categoryId: string;
  category: { name: string };
}): MenuItemRecord {
  return {
    id: item.id,
    name: item.name,
    description: item.description,
    priceCents: item.priceCents,
    sortOrder: item.sortOrder,
    tags: parseMenuItemTags(item.tags),
    images: item.images,
    isAvailable: item.isAvailable,
    categoryId: item.categoryId,
    categoryName: item.category.name,
  };
}

export async function listMenuItems(
  restaurantId: string,
): Promise<MenuItemOption[]> {
  const items = await listMenuItemRecords(restaurantId, { availableOnly: true });

  return items.map((item) => ({
    id: item.id,
    name: item.name,
    description: item.description,
    priceCents: item.priceCents,
    categoryName: item.categoryName,
    images: item.images,
    tags: item.tags,
  }));
}

export async function listMenuItemRecords(
  restaurantId: string,
  options: { availableOnly?: boolean } = {},
): Promise<MenuItemRecord[]> {
  const items = await prisma.menuItem.findMany({
    where: {
      restaurantId,
      ...(options.availableOnly ? { isAvailable: true } : {}),
    },
    include: {
      category: {
        select: { name: true },
      },
    },
    orderBy: [
      { category: { sortOrder: "asc" } },
      { category: { name: "asc" } },
      { sortOrder: "asc" },
      { name: "asc" },
    ],
  });

  return items.map((item) => mapMenuItemRecord(item));
}

export async function listMenuCategories(
  restaurantId: string,
): Promise<MenuCategoryRecord[]> {
  const categories = await prisma.menuCategory.findMany({
    where: { restaurantId },
    include: {
      _count: {
        select: { items: true },
      },
    },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });

  return categories.map((category) => ({
    id: category.id,
    name: category.name,
    sortOrder: category.sortOrder,
    isActive: category.isActive,
    itemCount: category._count.items,
  }));
}

export async function createMenuCategory(
  restaurantId: string,
  input: { name: string },
): Promise<MenuCategoryRecord> {
  const maxSortOrder = await prisma.menuCategory.aggregate({
    where: { restaurantId },
    _max: { sortOrder: true },
  });

  const category = await prisma.menuCategory.create({
    data: {
      restaurantId,
      name: input.name.trim(),
      sortOrder: (maxSortOrder._max.sortOrder ?? -1) + 1,
    },
    include: {
      _count: {
        select: { items: true },
      },
    },
  });

  return {
    id: category.id,
    name: category.name,
    sortOrder: category.sortOrder,
    isActive: category.isActive,
    itemCount: category._count.items,
  };
}

export async function updateMenuCategory(
  restaurantId: string,
  categoryId: string,
  input: { name?: string; isActive?: boolean },
): Promise<MenuCategoryRecord> {
  const existing = await prisma.menuCategory.findFirst({
    where: { id: categoryId, restaurantId },
  });

  if (!existing) {
    throw new Error("Category not found");
  }

  const category = await prisma.menuCategory.update({
    where: { id: categoryId },
    data: {
      ...(input.name !== undefined ? { name: input.name.trim() } : {}),
      ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
    },
    include: {
      _count: {
        select: { items: true },
      },
    },
  });

  return {
    id: category.id,
    name: category.name,
    sortOrder: category.sortOrder,
    isActive: category.isActive,
    itemCount: category._count.items,
  };
}

export async function deleteMenuCategory(
  restaurantId: string,
  categoryId: string,
): Promise<boolean> {
  const existing = await prisma.menuCategory.findFirst({
    where: { id: categoryId, restaurantId },
  });

  if (!existing) {
    throw new Error("Category not found");
  }

  await prisma.menuCategory.delete({
    where: { id: categoryId },
  });

  return true;
}

export async function createMenuItem(
  restaurantId: string,
  input: {
    categoryId: string;
    name: string;
    description?: string;
    priceCents: number;
    isAvailable: boolean;
    images: string[];
    tags: MenuItemTag[];
  },
): Promise<MenuItemRecord> {
  const category = await prisma.menuCategory.findFirst({
    where: { id: input.categoryId, restaurantId },
  });

  if (!category) {
    throw new Error("Category not found");
  }

  const maxSortOrder = await prisma.menuItem.aggregate({
    where: { restaurantId, categoryId: input.categoryId },
    _max: { sortOrder: true },
  });

  await syncMenuCustomTagsFromItemTags(restaurantId, input.tags);
  const storedTags = normalizeMenuItemTagsForStorage(input.tags);

  const item = await prisma.menuItem.create({
    data: {
      restaurantId,
      categoryId: input.categoryId,
      name: input.name.trim(),
      description: input.description?.trim() || null,
      priceCents: input.priceCents,
      sortOrder: (maxSortOrder._max.sortOrder ?? -1) + 1,
      isAvailable: input.isAvailable,
      images: input.images,
      tags: storedTags as Prisma.InputJsonValue,
    },
    include: {
      category: {
        select: { name: true },
      },
    },
  });

  return mapMenuItemRecord(item);
}

export async function updateMenuItem(
  restaurantId: string,
  menuItemId: string,
  input: {
    categoryId?: string;
    name?: string;
    description?: string | null;
    priceCents?: number;
    isAvailable?: boolean;
    images?: string[];
    tags?: MenuItemTag[];
  },
): Promise<MenuItemRecord> {
  const existing = await prisma.menuItem.findFirst({
    where: { id: menuItemId, restaurantId },
  });

  if (!existing) {
    throw new Error("Menu item not found");
  }

  if (input.categoryId) {
    const category = await prisma.menuCategory.findFirst({
      where: { id: input.categoryId, restaurantId },
    });

    if (!category) {
      throw new Error("Category not found");
    }
  }

  if (input.tags !== undefined) {
    await syncMenuCustomTagsFromItemTags(restaurantId, input.tags);
  }

  const storedTags =
    input.tags !== undefined
      ? normalizeMenuItemTagsForStorage(input.tags)
      : undefined;

  const item = await prisma.menuItem.update({
    where: { id: menuItemId },
    data: {
      ...(input.categoryId !== undefined ? { categoryId: input.categoryId } : {}),
      ...(input.name !== undefined ? { name: input.name.trim() } : {}),
      ...(input.description !== undefined
        ? { description: input.description?.trim() || null }
        : {}),
      ...(input.priceCents !== undefined ? { priceCents: input.priceCents } : {}),
      ...(input.isAvailable !== undefined ? { isAvailable: input.isAvailable } : {}),
      ...(input.images !== undefined ? { images: input.images } : {}),
      ...(storedTags !== undefined
        ? { tags: storedTags as Prisma.InputJsonValue }
        : {}),
    },
    include: {
      category: {
        select: { name: true },
      },
    },
  });

  return mapMenuItemRecord(item);
}

export async function updateMenuItemImages(
  restaurantId: string,
  menuItemId: string,
  images: string[],
) {
  return updateMenuItem(restaurantId, menuItemId, { images });
}

export async function deleteMenuItem(
  restaurantId: string,
  menuItemId: string,
): Promise<boolean> {
  const existing = await prisma.menuItem.findFirst({
    where: { id: menuItemId, restaurantId },
  });

  if (!existing) {
    throw new Error("Menu item not found");
  }

  await prisma.menuItem.delete({
    where: { id: menuItemId },
  });

  return true;
}

export async function reorderMenuLayout(
  restaurantId: string,
  input: {
    categories: Array<{ id: string; sortOrder: number }>;
    items: Array<{ id: string; categoryId: string; sortOrder: number }>;
  },
) {
  const [categoryCount, itemCount] = await Promise.all([
    prisma.menuCategory.count({
      where: {
        restaurantId,
        id: { in: input.categories.map((category) => category.id) },
      },
    }),
    prisma.menuItem.count({
      where: {
        restaurantId,
        id: { in: input.items.map((item) => item.id) },
      },
    }),
  ]);

  if (
    categoryCount !== input.categories.length ||
    itemCount !== input.items.length
  ) {
    throw new Error("Invalid menu layout");
  }

  await prisma.$transaction([
    ...input.categories.map((category) =>
      prisma.menuCategory.update({
        where: { id: category.id },
        data: { sortOrder: category.sortOrder },
      }),
    ),
    ...input.items.map((item) =>
      prisma.menuItem.update({
        where: { id: item.id },
        data: {
          categoryId: item.categoryId,
          sortOrder: item.sortOrder,
        },
      }),
    ),
  ]);

  return true;
}
