import { z } from "zod";
import type { ColumnMapping } from "@/lib/menu/import-products.types";
import { IMPORT_FILE_FIELDS } from "@/lib/menu/import-products.types";

export const importFromRestaurantsSchema = z.object({
  restaurantId: z.string().trim().min(1),
  categoryIds: z.array(z.string().trim().min(1)).default([]),
  productIds: z.array(z.string().trim().min(1)).default([]),
});

export const columnMappingSchema = z.record(
  z.enum(IMPORT_FILE_FIELDS),
  z.string().trim().min(1),
);

export function parseColumnMappingFromFormData(
  value: FormDataEntryValue | null,
): ColumnMapping | undefined {
  if (typeof value !== "string" || value.length === 0) {
    return undefined;
  }

  try {
    const parsed = JSON.parse(value) as unknown;
    const result = columnMappingSchema.safeParse(parsed);
    return result.success ? result.data : undefined;
  } catch {
    return undefined;
  }
}
