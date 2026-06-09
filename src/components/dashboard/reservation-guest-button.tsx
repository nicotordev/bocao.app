"use client";

import { TbMail, TbNotes, TbPhone } from "react-icons/tb";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { DashboardReservationPreview } from "@/lib/dashboard/data";
import { cn } from "@/lib/utils";

type ReservationGuestButtonLabels = {
  ariaLabel: string;
  phone: string;
  email: string;
  reservationNotes: string;
  noContactInfo: string;
};

type ReservationGuestButtonProps = {
  reservation: Pick<
    DashboardReservationPreview,
    "guestName" | "guestPhoto" | "guestPhone" | "guestEmail" | "guestNotes"
  >;
  labels: ReservationGuestButtonLabels;
  className?: string;
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function ReservationGuestButton({
  reservation,
  labels,
  className,
}: ReservationGuestButtonProps) {
  const hasContactInfo = Boolean(
    reservation.guestPhone || reservation.guestEmail || reservation.guestNotes,
  );

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className={cn(
            "size-9 shrink-0 rounded-full p-0 hover:bg-sidebar-accent/60",
            className,
          )}
          aria-label={labels.ariaLabel.replace("{name}", reservation.guestName)}
        >
          <Avatar size="sm" className="ring-1 ring-border/50">
            {reservation.guestPhoto ? (
              <AvatarImage
                src={reservation.guestPhoto}
                alt={reservation.guestName}
              />
            ) : null}
            <AvatarFallback className="bg-gradient-to-br from-primary/10 to-emerald-500/10 text-primary text-xs font-semibold">
              {getInitials(reservation.guestName)}
            </AvatarFallback>
          </Avatar>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72">
        <PopoverHeader>
          <PopoverTitle>{reservation.guestName}</PopoverTitle>
        </PopoverHeader>

        <div className="space-y-2.5 text-sm">
          {reservation.guestPhone ? (
            <div className="flex items-start gap-2.5 rounded-xl border border-border/50 bg-muted/20 px-3 py-2">
              <TbPhone
                className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                aria-hidden
              />
              <div className="min-w-0">
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  {labels.phone}
                </p>
                <p className="truncate font-medium">{reservation.guestPhone}</p>
              </div>
            </div>
          ) : null}

          {reservation.guestEmail ? (
            <div className="flex items-start gap-2.5 rounded-xl border border-border/50 bg-muted/20 px-3 py-2">
              <TbMail
                className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                aria-hidden
              />
              <div className="min-w-0">
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  {labels.email}
                </p>
                <p className="truncate font-medium">{reservation.guestEmail}</p>
              </div>
            </div>
          ) : null}

          {reservation.guestNotes ? (
            <div className="flex items-start gap-2.5 rounded-xl border border-border/50 bg-muted/20 px-3 py-2">
              <TbNotes
                className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                aria-hidden
              />
              <div className="min-w-0">
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  {labels.reservationNotes}
                </p>
                <p className="text-sm leading-relaxed text-foreground/90">
                  {reservation.guestNotes}
                </p>
              </div>
            </div>
          ) : null}

          {!hasContactInfo ? (
            <p className="rounded-xl border border-dashed border-border/60 px-3 py-2 text-sm text-muted-foreground">
              {labels.noContactInfo}
            </p>
          ) : null}
        </div>
      </PopoverContent>
    </Popover>
  );
}
