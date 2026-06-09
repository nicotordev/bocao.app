import { getTranslations } from "next-intl/server";
import { UpcomingReservationItem } from "@/components/dashboard/upcoming-reservation-item";
import type { DashboardReservationPreview } from "@/lib/dashboard/data";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type UpcomingReservationsListProps = {
  reservations: DashboardReservationPreview[];
};

export async function UpcomingReservationsList({
  reservations,
}: UpcomingReservationsListProps) {
  const t = await getTranslations("dashboard.home.reservations");

  const itemLabels = {
    guestCount: t.raw("guestCount"),
    viewReservation: t.raw("viewReservation"),
    status: {
      confirmed: t("status.confirmed"),
      pending: t("status.pending"),
      seated: t("status.seated"),
    },
    guestButton: {
      ariaLabel: t.raw("guestButton.ariaLabel"),
      phone: t("guestButton.phone"),
      email: t("guestButton.email"),
      reservationNotes: t("guestButton.reservationNotes"),
      noContactInfo: t("guestButton.noContactInfo"),
    },
  };

  return (
    <Card className="border-border/60">
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {reservations.map((reservation) => (
            <UpcomingReservationItem
              key={reservation.id}
              reservation={reservation}
              labels={itemLabels}
            />
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
