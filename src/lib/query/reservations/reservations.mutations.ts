import { useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  CreateReservationInput,
  UpdateReservationInput,
} from "@/lib/reservations/types";
import {
  deleteReservationRequest,
  patchReservation,
  postReservation,
} from "@/lib/query/reservations/reservations.api";
import { queryKeys } from "@/lib/query/query-keys";

export function useCreateReservationMutation(restaurantId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateReservationInput) =>
      postReservation(restaurantId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.reservations.lists(),
      });
    },
  });
}

export function useUpdateReservationMutation(restaurantId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      reservationId,
      input,
    }: {
      reservationId: string;
      input: UpdateReservationInput;
    }) => patchReservation(restaurantId, reservationId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.reservations.lists(),
      });
    },
  });
}

export function useDeleteReservationMutation(restaurantId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (reservationId: string) =>
      deleteReservationRequest(restaurantId, reservationId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.reservations.lists(),
      });
    },
  });
}
