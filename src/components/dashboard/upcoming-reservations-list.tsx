import { TbUsers } from "react-icons/tb";
import { getTranslations } from "next-intl/server";
import type { DashboardReservationPreview } from "@/lib/dashboard/data";
import { Badge } from "@/components/ui/badge";
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

  return (
    <Card className="border-border/60">
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {reservations.map((reservation) => (
            <li
              key={reservation.id}
              className="flex items-center justify-between gap-3 rounded-2xl border border-border/50 bg-muted/20 px-4 py-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">
                  {reservation.guestName}
                </p>
                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                  <TbUsers className="size-3.5" aria-hidden />
                  {t("guestCount", { count: reservation.guestCount })}
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <span className="text-sm font-medium">
                  {reservation.scheduledAt}
                </span>
                <Badge variant="outline">
                  {t(`status.${reservation.status}`)}
                </Badge>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
