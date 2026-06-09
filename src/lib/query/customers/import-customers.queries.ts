import { queryOptions, useQuery } from "@tanstack/react-query";
import { fetchImportableCustomers } from "@/lib/query/customers/import-customers.api";
import { queryKeys } from "@/lib/query/query-keys";

export function importableCustomersQueryOptions(
  restaurantId: string,
  enabled = true,
) {
  return queryOptions({
    queryKey: queryKeys.customers.importable(restaurantId),
    queryFn: () => fetchImportableCustomers(restaurantId),
    enabled: enabled && restaurantId.length > 0,
    staleTime: 30_000,
  });
}

export function useImportableCustomersQuery(
  restaurantId: string,
  enabled = true,
) {
  return useQuery(importableCustomersQueryOptions(restaurantId, enabled));
}
