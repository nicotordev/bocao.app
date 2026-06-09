import { z } from "zod";
import type { CustomerColumnMapping } from "@/lib/customers/import-customers.types";
import { IMPORT_CUSTOMER_FILE_FIELDS } from "@/lib/customers/import-customers.types";

export const importCustomersFromRestaurantsSchema = z.object({
  restaurantId: z.string().trim().min(1),
  customerIds: z.array(z.string().trim().min(1)).min(1),
});

export const customerColumnMappingSchema = z.record(
  z.enum(IMPORT_CUSTOMER_FILE_FIELDS),
  z.string().trim().min(1),
);

export function parseCustomerColumnMappingFromFormData(
  value: FormDataEntryValue | null,
): CustomerColumnMapping | undefined {
  if (typeof value !== "string" || value.length === 0) {
    return undefined;
  }

  try {
    const parsed = JSON.parse(value) as unknown;
    const result = customerColumnMappingSchema.safeParse(parsed);
    return result.success ? result.data : undefined;
  } catch {
    return undefined;
  }
}
