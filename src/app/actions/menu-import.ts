"use server";

import { revalidatePath } from "next/cache";
import { requireMenuImportWriteAccess } from "@/lib/menu/import-products.access";
import {
  getValidRowsFromPreview,
  parseMenuImportFile,
} from "@/lib/menu/import-products-file.parser";
import {
  importMenuProductsFromFileRows,
  importMenuProductsFromRestaurants,
} from "@/lib/menu/import-products.repository";
import {
  importFromRestaurantsSchema,
  parseColumnMappingFromFormData,
} from "@/lib/menu/import-products.schemas";
import type {
  ImportProductsResult,
  MenuImportFilePreview,
} from "@/lib/menu/import-products.types";

export async function importMenuProductsFromRestaurantsAction(input: {
  restaurantId: string;
  categoryIds: string[];
  productIds: string[];
}): Promise<ImportProductsResult> {
  const parsed = importFromRestaurantsSchema.safeParse(input);

  if (!parsed.success) {
    return { ok: false, error: "INVALID_INPUT" };
  }

  const access = await requireMenuImportWriteAccess(parsed.data.restaurantId);

  if (!access.ok) {
    return { ok: false, error: "FORBIDDEN" };
  }

  const result = await importMenuProductsFromRestaurants({
    targetRestaurantId: parsed.data.restaurantId,
    userId: access.userId,
    categoryIds: parsed.data.categoryIds,
    productIds: parsed.data.productIds,
  });

  if (result.ok) {
    revalidatePath("/dashboard/menu");
  }

  return result;
}

export async function previewMenuImportFileAction(
  formData: FormData,
): Promise<
  { ok: true; preview: MenuImportFilePreview } | { ok: false; error: string }
> {
  const restaurantId = formData.get("restaurantId");
  const file = formData.get("file");

  if (typeof restaurantId !== "string" || restaurantId.length === 0) {
    return { ok: false, error: "INVALID_INPUT" };
  }

  if (!(file instanceof File)) {
    return { ok: false, error: "NO_FILE" };
  }

  const access = await requireMenuImportWriteAccess(restaurantId);

  if (!access.ok) {
    return { ok: false, error: "FORBIDDEN" };
  }

  const columnMapping = parseColumnMappingFromFormData(
    formData.get("columnMapping"),
  );

  return parseMenuImportFile(file, columnMapping);
}

export async function importMenuProductsFromFileAction(
  formData: FormData,
): Promise<ImportProductsResult> {
  const restaurantId = formData.get("restaurantId");
  const file = formData.get("file");

  if (typeof restaurantId !== "string" || restaurantId.length === 0) {
    return { ok: false, error: "INVALID_INPUT" };
  }

  if (!(file instanceof File)) {
    return { ok: false, error: "NO_FILE" };
  }

  const access = await requireMenuImportWriteAccess(restaurantId);

  if (!access.ok) {
    return { ok: false, error: "FORBIDDEN" };
  }

  const columnMapping = parseColumnMappingFromFormData(
    formData.get("columnMapping"),
  );

  const parsed = await parseMenuImportFile(file, columnMapping);

  if (!parsed.ok) {
    return { ok: false, error: parsed.error };
  }

  const rows = getValidRowsFromPreview(parsed.preview);

  if (rows.length === 0) {
    return { ok: false, error: "INVALID_ROWS" };
  }

  const result = await importMenuProductsFromFileRows({
    targetRestaurantId: restaurantId,
    rows,
  });

  if (result.ok) {
    revalidatePath("/dashboard/menu");
  }

  return result;
}
