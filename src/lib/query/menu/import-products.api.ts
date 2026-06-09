import type { ImportableMenuResponse } from "@/lib/menu/import-products.types";
import { apiRequest } from "@/lib/query/api-client";

export async function fetchImportableMenu(
  restaurantId: string,
): Promise<ImportableMenuResponse> {
  return apiRequest<ImportableMenuResponse>(
    `/api/restaurants/${restaurantId}/menu/importable`,
  );
}

export function getMenuImportTemplateUrl(restaurantId: string) {
  return `/api/restaurants/${restaurantId}/menu/import-template`;
}
