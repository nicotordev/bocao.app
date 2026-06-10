import { useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  CreateCustomerInput,
  UpdateCustomerInput,
} from "@/lib/customers/types";
import {
  deleteCustomer,
  deleteCustomers,
  patchCustomer,
  postCustomer,
} from "@/lib/query/customers/customers.api";
import { queryKeys } from "@/lib/query/query-keys";

function invalidateCustomerQueries(
  queryClient: ReturnType<typeof useQueryClient>,
) {
  queryClient.invalidateQueries({
    queryKey: queryKeys.customers.pages(),
  });
  queryClient.invalidateQueries({
    queryKey: queryKeys.customers.details(),
  });
}

export function useCreateCustomerMutation(restaurantId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateCustomerInput) =>
      postCustomer(restaurantId, input),
    onSuccess: () => {
      invalidateCustomerQueries(queryClient);
    },
  });
}

export function useUpdateCustomerMutation(restaurantId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      customerId,
      input,
    }: {
      customerId: string;
      input: UpdateCustomerInput;
    }) => patchCustomer(restaurantId, customerId, input),
    onSuccess: () => {
      invalidateCustomerQueries(queryClient);
    },
  });
}

export function useDeleteCustomersMutation(restaurantId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (customerIds: string[]) => {
      if (customerIds.length === 1) {
        return deleteCustomer(restaurantId, customerIds[0]!);
      }

      return deleteCustomers(restaurantId, customerIds);
    },
    onSuccess: () => {
      invalidateCustomerQueries(queryClient);
    },
  });
}
