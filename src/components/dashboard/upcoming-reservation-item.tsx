"use client";

import Link from "next/link";
import { TbUsers } from "react-icons/tb";
import { ReservationGuestButton } from "@/components/dashboard/reservation-guest-button";
import type { DashboardReservationPreview } from "@/lib/dashboard/data";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type UpcomingReservationItemLabels = {
  guestCount: string;
  viewReservation: string;
  status: Record<DashboardReservationPreview["status"], string>;
  guestButton: {
    ariaLabel: string;
    phone: string;
    email: string;
    reservationNotes: string;
    noContactInfo: string;
  };
};

type UpcomingReservationItemProps = {
  reservation: DashboardReservationPreview;
  labels: UpcomingReservationItemLabels;
};

export function UpcomingReservationItem({
  reservation,
  labels,
}: UpcomingReservationItemProps) {
  return (
    <li>
      <Link
        href={`/dashboard/reservations/${reservation.id}`}
        aria-label={labels.viewReservation.replace(
          "{name}",
          reservation.guestName,
        )}
        className={cn(
          "flex items-center gap-3 rounded-2xl border border-border/50 bg-muted/20 px-3 py-3",
          "transition-colors hover:border-border hover:bg-muted/35",
        )}
      >
        <div
          className="relative z-10"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
          }}
        >
          <ReservationGuestButton
            reservation={reservation}
            labels={labels.guestButton}
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">
            {reservation.guestName}
          </p>
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <TbUsers className="size-3.5" aria-hidden />
            {labels.guestCount.replace(
              "{count}",
              String(reservation.guestCount),
            )}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <span className="text-sm font-medium">{reservation.scheduledAt}</span>
          <Badge variant="outline">{labels.status[reservation.status]}</Badge>
        </div>
      </Link>
    </li>
  );
}
