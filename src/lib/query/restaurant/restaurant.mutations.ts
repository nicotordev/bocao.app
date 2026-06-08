import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  switchRestaurant,
  type SwitchRestaurantResult,
} from "@/app/actions/switch-restaurant";
import { queryKeys } from "@/lib/query/query-keys";

export function useSwitchRestaurantMutation() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (restaurantId: string) => switchRestaurant(restaurantId),
    onSuccess: (result: SwitchRestaurantResult) => {
      if (!result.success) {
        return;
      }

      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.restaurants.all });
      router.refresh();
    },
  });
}
