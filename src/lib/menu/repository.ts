import type { MenuItemOption, MenuItemRecord } from "@/lib/menu/types";
import { prisma } from "@/lib/prisma";

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
    orderBy: [{ category: { name: "asc" } }, { name: "asc" }],
  });

  return items.map((item) => ({
    id: item.id,
    name: item.name,
    description: item.description,
    priceCents: item.priceCents,
    images: item.images,
    isAvailable: item.isAvailable,
    categoryName: item.category.name,
  }));
}

export async function updateMenuItemImages(
  restaurantId: string,
  menuItemId: string,
  images: string[],
) {
  const item = await prisma.menuItem.findFirst({
    where: {
      id: menuItemId,
      restaurantId,
    },
    include: {
      category: {
        select: { name: true },
      },
    },
  });

  if (!item) {
    throw new Error("Menu item not found");
  }

  const updated = await prisma.menuItem.update({
    where: { id: item.id },
    data: { images },
    include: {
      category: {
        select: { name: true },
      },
    },
  });

  return {
    id: updated.id,
    name: updated.name,
    description: updated.description,
    priceCents: updated.priceCents,
    images: updated.images,
    isAvailable: updated.isAvailable,
    categoryName: updated.category.name,
  } satisfies MenuItemRecord;
}
