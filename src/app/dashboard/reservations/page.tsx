import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { ReservationsPageClient } from "@/components/dashboard/reservations/reservations-page-client";
import { listCustomers } from "@/lib/customers/repository";
import { getDashboardContext } from "@/lib/dashboard/context";
import { getReservationsPageLabels } from "@/lib/reservations/page-labels";
import { getQueryClient } from "@/lib/query/get-query-client";
import { reservationsListQueryOptions } from "@/lib/query/reservations/reservations.queries";

export default async function ReservationsPage() {
  const context = await getDashboardContext();
  const restaurantId = context?.activeRestaurant?.id ?? "";
  const queryClient = getQueryClient();
  const customers = restaurantId ? await listCustomers(restaurantId) : [];

  if (restaurantId) {
    await queryClient.prefetchQuery(reservationsListQueryOptions(restaurantId));
  }

  const labels = await getReservationsPageLabels();

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ReservationsPageClient
        labels={labels}
        restaurantId={restaurantId}
        customers={customers}
      />
    </HydrationBoundary>
  );
}
