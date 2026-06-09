import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import {
  assertSourceRestaurantsAccessible,
  getTargetRestaurantOrganizationId,
} from "@/lib/menu/import-products.access";
import type {
  ImportProductsResult,
  NormalizedImportRow,
} from "@/lib/menu/import-products.types";
import { prisma } from "@/lib/prisma";

type ProductToImport = {
  sourceCategoryName: string;
  name: string;
  description: string | null;
  priceCents: number;
  imageUrl: string | null;
  isAvailable: boolean;
};

function normalizeCategoryName(name: string) {
  return name.trim().toLowerCase();
}

async function buildCategoryIdMap(
  tx: Prisma.TransactionClient,
  targetRestaurantId: string,
  categoryNames: string[],
) {
  const existingCategories = await tx.menuCategory.findMany({
    where: { restaurantId: targetRestaurantId },
    select: { id: true, name: true, sortOrder: true },
  });

  const categoryIdByName = new Map<string, string>();
  let maxSortOrder = existingCategories.reduce(
    (max, category) => Math.max(max, category.sortOrder),
    -1,
  );
  let createdCategories = 0;

  for (const category of existingCategories) {
    categoryIdByName.set(normalizeCategoryName(category.name), category.id);
  }

  const uniqueNames = Array.from(
    new Set(categoryNames.map((name) => name.trim()).filter(Boolean)),
  );

  for (const categoryName of uniqueNames) {
    const key = normalizeCategoryName(categoryName);

    if (categoryIdByName.has(key)) {
      continue;
    }

    maxSortOrder += 1;
    const created = await tx.menuCategory.create({
      data: {
        restaurantId: targetRestaurantId,
        name: categoryName.trim(),
        sortOrder: maxSortOrder,
      },
      select: { id: true, name: true },
    });

    categoryIdByName.set(normalizeCategoryName(created.name), created.id);
    createdCategories += 1;
  }

  return { categoryIdByName, createdCategories };
}

async function getNextItemSortOrder(
  tx: Prisma.TransactionClient,
  targetRestaurantId: string,
  categoryId: string,
) {
  const maxSortOrder = await tx.menuItem.aggregate({
    where: { restaurantId: targetRestaurantId, categoryId },
    _max: { sortOrder: true },
  });

  return (maxSortOrder._max.sortOrder ?? -1) + 1;
}

async function importProductsIntoRestaurant(
  targetRestaurantId: string,
  products: ProductToImport[],
): Promise<{ importedCategories: number; importedProducts: number }> {
  if (products.length === 0) {
    return { importedCategories: 0, importedProducts: 0 };
  }

  return prisma.$transaction(async (tx) => {
    const { categoryIdByName, createdCategories } = await buildCategoryIdMap(
      tx,
      targetRestaurantId,
      products.map((product) => product.sourceCategoryName),
    );

    let importedProducts = 0;
    const sortOrderByCategory = new Map<string, number>();

    for (const product of products) {
      const categoryId = categoryIdByName.get(
        normalizeCategoryName(product.sourceCategoryName),
      );

      if (!categoryId) {
        continue;
      }

      const currentSortOrder = sortOrderByCategory.get(categoryId);
      const sortOrder =
        currentSortOrder ??
        (await getNextItemSortOrder(tx, targetRestaurantId, categoryId));

      sortOrderByCategory.set(categoryId, sortOrder + 1);

      await tx.menuItem.create({
        data: {
          restaurantId: targetRestaurantId,
          categoryId,
          name: product.name.trim(),
          description: product.description?.trim() || null,
          priceCents: product.priceCents,
          sortOrder,
          isAvailable: product.isAvailable,
          images: product.imageUrl ? [product.imageUrl] : [],
          tags: [] as Prisma.InputJsonValue,
        },
      });

      importedProducts += 1;
    }

    return {
      importedCategories: createdCategories,
      importedProducts,
    };
  });
}

export async function importMenuProductsFromRestaurants(input: {
  targetRestaurantId: string;
  userId: string;
  categoryIds: string[];
  productIds: string[];
}): Promise<ImportProductsResult> {
  const { targetRestaurantId, userId, categoryIds, productIds } = input;

  if (categoryIds.length === 0 && productIds.length === 0) {
    return { ok: false, error: "NO_PRODUCTS_SELECTED" };
  }

  const targetOrgId =
    await getTargetRestaurantOrganizationId(targetRestaurantId);

  if (!targetOrgId) {
    return { ok: false, error: "FORBIDDEN" };
  }

  const selectedCategoryIds = new Set(categoryIds);
  const selectedProductIds = new Set(productIds);

  const sourceCategories = await prisma.menuCategory.findMany({
    where: {
      OR: [
        { id: { in: Array.from(selectedCategoryIds) } },
        { items: { some: { id: { in: Array.from(selectedProductIds) } } } },
      ],
    },
    include: {
      items: {
        select: {
          id: true,
          name: true,
          description: true,
          priceCents: true,
          images: true,
          isAvailable: true,
        },
      },
      restaurant: {
        select: { id: true },
      },
    },
  });

  const sourceRestaurantIds = Array.from(
    new Set(sourceCategories.map((category) => category.restaurant.id)),
  );

  const accessible = await assertSourceRestaurantsAccessible(
    userId,
    sourceRestaurantIds,
  );

  if (!accessible) {
    return { ok: false, error: "FORBIDDEN" };
  }

  const productsToImport: ProductToImport[] = [];

  for (const category of sourceCategories) {
    if (category.restaurant.id === targetRestaurantId) {
      continue;
    }

    const fullCategorySelected = selectedCategoryIds.has(category.id);

    for (const item of category.items) {
      if (!fullCategorySelected && !selectedProductIds.has(item.id)) {
        continue;
      }

      productsToImport.push({
        sourceCategoryName: category.name,
        name: item.name,
        description: item.description,
        priceCents: item.priceCents,
        imageUrl: item.images[0] ?? null,
        isAvailable: item.isAvailable,
      });
    }
  }

  if (productsToImport.length === 0) {
    return { ok: false, error: "NO_PRODUCTS_SELECTED" };
  }

  try {
    const result = await importProductsIntoRestaurant(
      targetRestaurantId,
      productsToImport,
    );

    return { ok: true, ...result };
  } catch {
    return { ok: false, error: "IMPORT_FAILED" };
  }
}

export async function importMenuProductsFromFileRows(input: {
  targetRestaurantId: string;
  rows: NormalizedImportRow[];
}): Promise<ImportProductsResult> {
  const productsToImport: ProductToImport[] = input.rows.map((row) => ({
    sourceCategoryName: row.categoryName,
    name: row.productName,
    description: row.description,
    priceCents: row.priceCents,
    imageUrl: row.imageUrl,
    isAvailable: row.isAvailable,
  }));

  if (productsToImport.length === 0) {
    return { ok: false, error: "NO_PRODUCTS_SELECTED" };
  }

  try {
    const result = await importProductsIntoRestaurant(
      input.targetRestaurantId,
      productsToImport,
    );

    return { ok: true, ...result };
  } catch {
    return { ok: false, error: "IMPORT_FAILED" };
  }
}
