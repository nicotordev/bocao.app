import type { ImportableCustomersResponse } from "@/lib/customers/import-customers.types";
import { apiRequest } from "@/lib/query/api-client";

export async function fetchImportableCustomers(
  restaurantId: string,
): Promise<ImportableCustomersResponse> {
  return apiRequest<ImportableCustomersResponse>(
    `/api/restaurants/${restaurantId}/customers/importable`,
  );
}

export function getCustomersImportTemplateUrl(restaurantId: string) {
  return `/api/restaurants/${restaurantId}/customers/import-template`;
}
