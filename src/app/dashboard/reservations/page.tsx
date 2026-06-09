import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getTranslations } from "next-intl/server";
import { ReservationsPageClient } from "@/components/dashboard/reservations/reservations-page-client";
import { listCustomers } from "@/lib/customers/repository";
import { getDashboardContext } from "@/lib/dashboard/context";
import { searchParamsToRecord } from "@/lib/list-url";
import { parseReservationsListSearchParams } from "@/lib/reservations/filters";
import { getReservationsPageLabels } from "@/lib/reservations/page-labels";
import {
  getReservation,
  getReservationsKpis,
} from "@/lib/reservations/repository";
import { getQueryClient } from "@/lib/query/get-query-client";
import { reservationsListQueryOptions } from "@/lib/query/reservations/reservations.queries";

type ReservationsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ReservationsPage({
  searchParams,
}: ReservationsPageProps) {
  const resolvedSearchParams = searchParamsToRecord(await searchParams);
  const reservationId = Array.isArray(resolvedSearchParams.reservationId)
    ? resolvedSearchParams.reservationId[0]
    : resolvedSearchParams.reservationId;
  const filters = parseReservationsListSearchParams(resolvedSearchParams);
  const context = await getDashboardContext();
  const restaurantId = context?.activeRestaurant?.id ?? "";
  const queryClient = getQueryClient();
  const customers = restaurantId ? await listCustomers(restaurantId) : [];

  if (restaurantId) {
    await queryClient.prefetchQuery(
      reservationsListQueryOptions(restaurantId, filters),
    );
  }

  const [labels, initialReservation, kpis] = await Promise.all([
    getReservationsPageLabels(),
    restaurantId && reservationId
      ? getReservation(restaurantId, reservationId)
      : Promise.resolve(null),
    restaurantId ? getReservationsKpis(restaurantId) : Promise.resolve(null),
  ]);

  const tCommon = await getTranslations("common");

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ReservationsPageClient
        key={reservationId ?? "list"}
        labels={{
          ...labels,
          pagination: {
            previous: tCommon("pagination.previous"),
            next: tCommon("pagination.next"),
            page: tCommon("pagination.page"),
            of: tCommon("pagination.of"),
          },
        }}
        restaurantId={restaurantId}
        customers={customers}
        initialReservation={initialReservation}
        initialKpis={kpis}
      />
    </HydrationBoundary>
  );
}
