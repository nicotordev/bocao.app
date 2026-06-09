import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { CreateCustomerInput } from "@/lib/customers/types";
import { postCustomer } from "@/lib/query/customers/customers.api";
import { queryKeys } from "@/lib/query/query-keys";

export function useCreateCustomerMutation(restaurantId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateCustomerInput) =>
      postCustomer(restaurantId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.customers.pages(),
      });
    },
  });
}
