import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { z } from "zod";
import type {
  createKitchenStationBodySchema,
  updateKitchenStationBodySchema,
} from "@/lib/kitchen/stations/schemas";
import {
  createKitchenStationRequest,
  deleteKitchenStationRequest,
  reorderKitchenStationRequest,
  toggleKitchenStationActiveRequest,
  updateKitchenStationRequest,
} from "@/lib/query/kitchen/stations.api";
import { queryKeys } from "@/lib/query/query-keys";

type CreateKitchenStationInput = z.infer<typeof createKitchenStationBodySchema>;
type UpdateKitchenStationInput = z.infer<typeof updateKitchenStationBodySchema>;

export function useKitchenStationMutations(restaurantId: string) {
  const queryClient = useQueryClient();
  const queryKey = queryKeys.kitchen.stationsList(restaurantId);

  const invalidate = () => queryClient.invalidateQueries({ queryKey });

  const createMutation = useMutation({
    mutationFn: (input: CreateKitchenStationInput) =>
      createKitchenStationRequest(restaurantId, input),
    onSuccess: invalidate,
  });

  const updateMutation = useMutation({
    mutationFn: ({
      stationId,
      input,
    }: {
      stationId: string;
      input: UpdateKitchenStationInput;
    }) => updateKitchenStationRequest(restaurantId, stationId, input),
    onSuccess: invalidate,
  });

  const toggleActiveMutation = useMutation({
    mutationFn: (stationId: string) =>
      toggleKitchenStationActiveRequest(restaurantId, stationId),
    onSuccess: invalidate,
  });

  const reorderMutation = useMutation({
    mutationFn: ({
      stationId,
      direction,
    }: {
      stationId: string;
      direction: "up" | "down";
    }) => reorderKitchenStationRequest(restaurantId, stationId, direction),
    onSuccess: (data) => {
      queryClient.setQueryData(queryKey, data);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (stationId: string) =>
      deleteKitchenStationRequest(restaurantId, stationId),
    onSuccess: invalidate,
  });

  return {
    createMutation,
    updateMutation,
    toggleActiveMutation,
    reorderMutation,
    deleteMutation,
  };
}
