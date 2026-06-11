import { queryOptions, useQuery } from "@tanstack/react-query";
import type { CustomersListFilters } from "@/lib/customers/filters";
import {
  fetchCustomerDetail,
  fetchCustomerOptions,
  fetchCustomersPage,
} from "@/lib/query/customers/customers.api";
import { customersPageQueryFilters } from "@/lib/customers/filters";
import { queryKeys } from "@/lib/query/query-keys";

export function customersPageQueryOptions(
  restaurantId: string,
  filters?: CustomersListFilters,
) {
  const dataFilters = customersPageQueryFilters(
    filters ?? { page: 1, pageSize: 20 },
  );

  return queryOptions({
    queryKey: queryKeys.customers.page(restaurantId, dataFilters),
    queryFn: () => fetchCustomersPage(restaurantId, dataFilters),
    enabled: restaurantId.length > 0,
    staleTime: 30_000,
  });
}

export function customerOptionsQueryOptions(restaurantId: string) {
  return queryOptions({
    queryKey: queryKeys.customers.options(restaurantId),
    queryFn: () => fetchCustomerOptions(restaurantId),
    enabled: restaurantId.length > 0,
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: false,
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

export function useCustomerOptionsQuery(restaurantId: string, enabled = true) {
  return useQuery({
    ...customerOptionsQueryOptions(restaurantId),
    enabled: enabled && restaurantId.length > 0,
  });
}
