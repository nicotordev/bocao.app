import { useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  BulkCustomerTagsInput,
  CreateCustomerTagInput,
} from "@/lib/customers/tags.types";
import {
  postBulkCustomerTags,
  postCustomerTag,
} from "@/lib/query/customers/customer-tags.api";
import { queryKeys } from "@/lib/query/query-keys";

function invalidateCustomerData(
  queryClient: ReturnType<typeof useQueryClient>,
  organizationId: string,
) {
  queryClient.invalidateQueries({
    queryKey: queryKeys.customers.tagsList(organizationId),
  });
  queryClient.invalidateQueries({
    queryKey: queryKeys.customers.pages(),
  });
  queryClient.invalidateQueries({
    queryKey: queryKeys.customers.details(),
  });
}

export function useCreateCustomerTagMutation(organizationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateCustomerTagInput) =>
      postCustomerTag(organizationId, input),
    onMutate: async (input) => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.customers.tagsList(organizationId),
      });

      const previousTags = queryClient.getQueryData(
        queryKeys.customers.tagsList(organizationId),
      );

      const optimisticTag = {
        id: `optimistic-${Date.now()}`,
        name: input.name.trim(),
        color: input.color ?? null,
      };

      queryClient.setQueryData(
        queryKeys.customers.tagsList(organizationId),
        (current: typeof optimisticTag[] | undefined) => [
          ...(current ?? []),
          optimisticTag,
        ],
      );

      return { previousTags, optimisticTag };
    },
    onError: (_error, _input, context) => {
      if (context?.previousTags) {
        queryClient.setQueryData(
          queryKeys.customers.tagsList(organizationId),
          context.previousTags,
        );
      }
    },
    onSuccess: (tag, _input, context) => {
      queryClient.setQueryData(
        queryKeys.customers.tagsList(organizationId),
        (current: typeof tag[] | undefined) =>
          (current ?? []).map((entry) =>
            entry.id === context?.optimisticTag.id ? tag : entry,
          ),
      );
    },
    onSettled: () => {
      invalidateCustomerData(queryClient, organizationId);
    },
  });
}

export function useBulkCustomerTagsMutation(restaurantId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: BulkCustomerTagsInput) =>
      postBulkCustomerTags(restaurantId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.customers.pages(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.customers.details(),
      });
    },
  });
}
