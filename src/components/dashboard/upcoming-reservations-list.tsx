import { TbCalendar } from "react-icons/tb";
import { getTranslations } from "next-intl/server";
import { UpcomingReservationItem } from "@/components/dashboard/upcoming-reservation-item";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import type { DashboardReservationPreview } from "@/lib/dashboard/data";
import type { ReservationStatus } from "@/lib/reservations/types";
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
  const tStatuses = await getTranslations("dashboard.reservations.statuses");

  const statusLabels = {
    PENDING: tStatuses("PENDING"),
    CONFIRMED: tStatuses("CONFIRMED"),
    SEATED: tStatuses("SEATED"),
    COMPLETED: tStatuses("COMPLETED"),
    CANCELLED: tStatuses("CANCELLED"),
    NO_SHOW: tStatuses("NO_SHOW"),
  } satisfies Record<ReservationStatus, string>;

  const itemLabels = {
    guestCount: t.raw("guestCount"),
    viewReservation: t.raw("viewReservation"),
    status: statusLabels,
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
        {reservations.length === 0 ? (
          <Empty className="border border-dashed border-border/70 bg-muted/10 py-10">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <TbCalendar aria-hidden />
              </EmptyMedia>
              <EmptyTitle>{t("empty.title")}</EmptyTitle>
              <EmptyDescription className="max-w-sm">
                {t("empty.description")}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <ul className="space-y-3">
            {reservations.map((reservation) => (
              <UpcomingReservationItem
                key={reservation.id}
                reservation={reservation}
                labels={itemLabels}
              />
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
