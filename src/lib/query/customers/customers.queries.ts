import { queryOptions, useQuery } from "@tanstack/react-query";
import type { CustomersListFilters } from "@/lib/customers/filters";
import {
  fetchCustomerDetail,
  fetchCustomersPage,
} from "@/lib/query/customers/customers.api";
import { queryKeys } from "@/lib/query/query-keys";

export function customersPageQueryOptions(
  restaurantId: string,
  filters?: CustomersListFilters,
) {
  return queryOptions({
    queryKey: queryKeys.customers.page(restaurantId, filters),
    queryFn: () => fetchCustomersPage(restaurantId, filters),
    enabled: restaurantId.length > 0,
    staleTime: 30_000,
  });
}

export function customerDetailQueryOptions(
  restaurantId: string,
  customerId: string,
) {
  return queryOptions({
    queryKey: queryKeys.customers.detail(restaurantId, customerId),
    queryFn: () => fetchCustomerDetail(restaurantId, customerId),
    enabled: restaurantId.length > 0 && customerId.length > 0,
    staleTime: 30_000,
  });
}

export function useCustomersPageQuery(
  restaurantId: string,
  filters?: CustomersListFilters,
) {
  return useQuery(customersPageQueryOptions(restaurantId, filters));
}

export function useCustomerDetailQuery(
  restaurantId: string,
  customerId: string,
  enabled = true,
) {
  return useQuery({
    ...customerDetailQueryOptions(restaurantId, customerId),
    enabled: enabled && restaurantId.length > 0 && customerId.length > 0,
  });
}
