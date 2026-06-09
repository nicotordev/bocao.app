import { queryOptions, useQuery } from "@tanstack/react-query";
import { fetchImportableMenu } from "@/lib/query/menu/import-products.api";
import { queryKeys } from "@/lib/query/query-keys";

export function importableMenuQueryOptions(
  restaurantId: string,
  enabled = true,
) {
  return queryOptions({
    queryKey: queryKeys.menu.importable(restaurantId),
    queryFn: () => fetchImportableMenu(restaurantId),
    enabled: enabled && restaurantId.length > 0,
    staleTime: 30_000,
  });
}

export function useImportableMenuQuery(restaurantId: string, enabled = true) {
  return useQuery(importableMenuQueryOptions(restaurantId, enabled));
}
