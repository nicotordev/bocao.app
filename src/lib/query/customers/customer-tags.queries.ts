import { queryOptions, useQuery } from "@tanstack/react-query";
import { fetchCustomerTags } from "@/lib/query/customers/customer-tags.api";
import { queryKeys } from "@/lib/query/query-keys";

export function customerTagsQueryOptions(organizationId: string) {
  return queryOptions({
    queryKey: queryKeys.customers.tagsList(organizationId),
    queryFn: () => fetchCustomerTags(organizationId),
    enabled: organizationId.length > 0,
  });
}

export function useCustomerTagsQuery(organizationId: string) {
  return useQuery(customerTagsQueryOptions(organizationId));
}
