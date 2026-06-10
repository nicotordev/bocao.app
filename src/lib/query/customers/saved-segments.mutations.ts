import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { CreateSavedSegmentInput } from "@/lib/customers/saved-segments.types";
import {
  addSavedCustomerSegmentMembers,
  createSavedCustomerSegment,
} from "@/lib/query/customers/saved-segments.api";
import { queryKeys } from "@/lib/query/query-keys";

export function useCreateSavedCustomerSegmentMutation(restaurantId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateSavedSegmentInput) =>
      createSavedCustomerSegment(restaurantId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.customers.pages(),
      });
    },
  });
}

export function useAddSavedCustomerSegmentMembersMutation(
  restaurantId: string,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      segmentId,
      customerIds,
    }: {
      segmentId: string;
      customerIds: string[];
    }) => addSavedCustomerSegmentMembers(restaurantId, segmentId, customerIds),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.customers.pages(),
      });
    },
  });
}
