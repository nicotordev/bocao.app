"use server";

import { revalidatePath } from "next/cache";
import { requireCustomersImportWriteAccess } from "@/lib/customers/import-customers.access";
import {
  getValidCustomerRowsFromPreview,
  parseCustomerImportFile,
} from "@/lib/customers/import-customers-file.parser";
import {
  importCustomersFromFileRows,
  importCustomersFromRestaurants,
} from "@/lib/customers/import-customers.repository";
import {
  importCustomersFromRestaurantsSchema,
  parseCustomerColumnMappingFromFormData,
} from "@/lib/customers/import-customers.schemas";
import type {
  CustomerImportFilePreview,
  ImportCustomersResult,
} from "@/lib/customers/import-customers.types";

export async function importCustomersFromRestaurantsAction(input: {
  restaurantId: string;
  customerIds: string[];
}): Promise<ImportCustomersResult> {
  const parsed = importCustomersFromRestaurantsSchema.safeParse(input);

  if (!parsed.success) {
    return { ok: false, error: "INVALID_INPUT" };
  }

  const access = await requireCustomersImportWriteAccess(parsed.data.restaurantId);

  if (!access.ok) {
    return { ok: false, error: "FORBIDDEN" };
  }

  const result = await importCustomersFromRestaurants({
    targetRestaurantId: parsed.data.restaurantId,
    userId: access.userId,
    customerIds: parsed.data.customerIds,
  });

  if (result.ok) {
    revalidatePath("/dashboard/customers");
  }

  return result;
}

export async function previewCustomerImportFileAction(
  formData: FormData,
): Promise<
  | { ok: true; preview: CustomerImportFilePreview }
  | { ok: false; error: string }
> {
  const restaurantId = formData.get("restaurantId");
  const file = formData.get("file");

  if (typeof restaurantId !== "string" || restaurantId.length === 0) {
    return { ok: false, error: "INVALID_INPUT" };
  }

  if (!(file instanceof File)) {
    return { ok: false, error: "NO_FILE" };
  }

  const access = await requireCustomersImportWriteAccess(restaurantId);

  if (!access.ok) {
    return { ok: false, error: "FORBIDDEN" };
  }

  const columnMapping = parseCustomerColumnMappingFromFormData(
    formData.get("columnMapping"),
  );

  return parseCustomerImportFile(file, columnMapping);
}

export async function importCustomersFromFileAction(
  formData: FormData,
): Promise<ImportCustomersResult> {
  const restaurantId = formData.get("restaurantId");
  const file = formData.get("file");

  if (typeof restaurantId !== "string" || restaurantId.length === 0) {
    return { ok: false, error: "INVALID_INPUT" };
  }

  if (!(file instanceof File)) {
    return { ok: false, error: "NO_FILE" };
  }

  const access = await requireCustomersImportWriteAccess(restaurantId);

  if (!access.ok) {
    return { ok: false, error: "FORBIDDEN" };
  }

  const columnMapping = parseCustomerColumnMappingFromFormData(
    formData.get("columnMapping"),
  );

  const parsed = await parseCustomerImportFile(file, columnMapping);

  if (!parsed.ok) {
    return { ok: false, error: parsed.error };
  }

  const rows = getValidCustomerRowsFromPreview(parsed.preview);

  if (rows.length === 0) {
    return { ok: false, error: "INVALID_ROWS" };
  }

  const result = await importCustomersFromFileRows({
    targetRestaurantId: restaurantId,
    rows,
  });

  if (result.ok) {
    revalidatePath("/dashboard/customers");
  }

  return result;
}
