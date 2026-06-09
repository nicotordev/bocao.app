import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ReservationDetailPageClient } from "@/components/dashboard/reservations/reservation-detail-page-client";
import { listCustomers } from "@/lib/customers/repository";
import { getDashboardContext } from "@/lib/dashboard/context";
import { getReservationsPageLabels } from "@/lib/reservations/page-labels";
import { getReservation } from "@/lib/reservations/repository";

type ReservationDetailPageProps = {
  params: Promise<{ reservationId: string }>;
};

export default async function ReservationDetailPage({
  params,
}: ReservationDetailPageProps) {
  const { reservationId } = await params;
  const t = await getTranslations("dashboard.reservations");
  const context = await getDashboardContext();
  const restaurantId = context?.activeRestaurant?.id ?? "";

  if (!restaurantId) {
    notFound();
  }

  const [reservation, customers, labels] = await Promise.all([
    getReservation(restaurantId, reservationId),
    listCustomers(restaurantId),
    getReservationsPageLabels(),
  ]);

  if (!reservation) {
    notFound();
  }

  return (
    <ReservationDetailPageClient
      labels={labels}
      restaurantId={restaurantId}
      reservation={reservation}
      customers={customers}
      backLabel={t("detail.backToList")}
    />
  );
}
