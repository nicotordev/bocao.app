"use client";

import {
  Edit,
  MoreHorizontal,
  Trash2,
  Calendar,
  Phone,
  Users,
  CheckCircle2,
  UserCheck,
  Check,
  XSquare,
  UserMinus,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ReservationStatusBadge } from "@/components/dashboard/reservations/reservation-status-badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Reservation, ReservationStatus } from "@/lib/reservations/types";
import { format } from "date-fns";
import { es, enUS } from "date-fns/locale";
import { useLocale } from "next-intl";

type ReservationsTableProps = {
  labels: any;
  reservations: Reservation[];
  onEdit: (reservation: Reservation) => void;
  onUpdateStatus: (id: string, status: ReservationStatus) => void;
  onDelete: (id: string) => void;
  isUpdating?: boolean;
};

export function ReservationsTable({
  labels,
  reservations,
  onEdit,
  onUpdateStatus,
  onDelete,
  isUpdating = false,
}: ReservationsTableProps) {
  const locale = useLocale();
  const dateLocale = locale === "es" ? es : enUS;

  if (reservations.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-border bg-card p-8 text-center animate-in fade-in-50 duration-200">
        <div className="mx-auto grid size-16 place-items-center rounded-3xl border border-border bg-muted/40">
          <Calendar className="size-7 text-muted-foreground" aria-hidden />
        </div>
        <h3 className="mt-5 font-heading text-lg font-semibold">
          {labels.empty.title}
        </h3>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          {labels.empty.description}
        </p>
      </div>
    );
  }

  const formatScheduledAt = (isoString: string) => {
    const d = new Date(isoString);
    return {
      time: format(d, "HH:mm"),
      date: format(d, locale === "es" ? "EEE d 'de' MMM" : "EEE, MMM d", {
        locale: dateLocale,
      }),
    };
  };

  return (
    <>
      {/* Desktop Table View */}
      <div className="hidden overflow-hidden rounded-3xl border border-border/70 bg-card lg:block shadow-sm transition-all duration-200">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30 border-b border-border/50">
              <TableHead className="w-[120px]">
                {labels.form.scheduledAt}
              </TableHead>
              <TableHead>{labels.form.guestName}</TableHead>
              <TableHead className="text-center w-[120px]">
                {labels.form.guestCount}
              </TableHead>
              <TableHead className="w-[140px]">{labels.form.status}</TableHead>
              <TableHead className="max-w-[300px]">
                {labels.form.notes}
              </TableHead>
              <TableHead className="text-right w-[100px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reservations.map((res) => {
              const { time, date } = formatScheduledAt(res.scheduledAt);
              return (
                <TableRow
                  key={res.id}
                  className="hover:bg-muted/10 transition-colors border-b border-border/40"
                >
                  <TableCell>
                    <div>
                      <p className="font-semibold text-foreground text-sm leading-none">
                        {time}
                      </p>
                      <p className="text-[11px] text-muted-foreground capitalize mt-1 leading-none">
                        {date}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-semibold text-sm text-foreground">
                        {res.guestName}
                      </p>
                      {res.guestPhone ? (
                        <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-1 leading-none">
                          <Phone className="size-3 shrink-0 opacity-60" />
                          {res.guestPhone}
                        </p>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 bg-muted text-[11px] font-semibold text-muted-foreground">
                      <Users className="size-3" />
                      {res.guestCount}
                    </span>
                  </TableCell>
                  <TableCell>
                    <ReservationStatusBadge
                      status={res.status}
                      label={labels.statuses[res.status]}
                    />
                  </TableCell>
                  <TableCell className="max-w-[300px] truncate text-xs text-muted-foreground">
                    {res.notes ? (
                      <span
                        className="flex items-center gap-1.5"
                        title={res.notes}
                      >
                        <FileText className="size-3.5 shrink-0 text-muted-foreground/60" />
                        <span className="truncate">{res.notes}</span>
                      </span>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <ReservationActions
                      labels={labels}
                      reservation={res}
                      onEdit={() => onEdit(res)}
                      onUpdateStatus={(status) =>
                        onUpdateStatus(res.id, status)
                      }
                      onDelete={() => onDelete(res.id)}
                      disabled={isUpdating}
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Grid View */}
      <div className="grid gap-3 lg:hidden">
        {reservations.map((res) => {
          const { time, date } = formatScheduledAt(res.scheduledAt);
          return (
            <div
              key={res.id}
              className="rounded-3xl border border-border/70 bg-card p-4 shadow-sm flex flex-col gap-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-base font-bold text-foreground leading-none">
                      {time}
                    </span>
                    <span className="text-[11px] text-muted-foreground capitalize leading-none bg-muted/40 px-1.5 py-0.5 rounded-md">
                      {date}
                    </span>
                  </div>
                  <p className="mt-2 font-semibold text-sm text-foreground truncate">
                    {res.guestName}
                  </p>
                  {res.guestPhone && (
                    <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-1 leading-none">
                      <Phone className="size-3 shrink-0 opacity-60" />
                      {res.guestPhone}
                    </p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <ReservationStatusBadge
                    status={res.status}
                    label={labels.statuses[res.status]}
                  />
                  <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 bg-muted text-[10px] font-semibold text-muted-foreground">
                    <Users className="size-2.5" />
                    {res.guestCount}
                  </span>
                </div>
              </div>

              {res.notes && (
                <div className="text-[11px] text-muted-foreground bg-muted/20 border border-border/30 rounded-2xl p-2.5 flex items-start gap-1.5">
                  <FileText className="size-3.5 shrink-0 text-muted-foreground/50 mt-0.5" />
                  <span className="leading-normal">{res.notes}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 border-t border-border/40 pt-3">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 rounded-xl text-xs gap-1"
                  onClick={() => onEdit(res)}
                  disabled={isUpdating}
                >
                  <Edit className="size-3" />
                  {labels.actions.edit}
                </Button>
                <ReservationActions
                  labels={labels}
                  reservation={res}
                  onEdit={() => onEdit(res)}
                  onUpdateStatus={(status) => onUpdateStatus(res.id, status)}
                  onDelete={() => onDelete(res.id)}
                  disabled={isUpdating}
                  variant="button"
                />
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

function ReservationActions({
  labels,
  reservation,
  onEdit,
  onUpdateStatus,
  onDelete,
  disabled = false,
  variant = "icon",
}: {
  labels: any;
  reservation: Reservation;
  onEdit: () => void;
  onUpdateStatus: (status: ReservationStatus) => void;
  onDelete: () => void;
  disabled?: boolean;
  variant?: "icon" | "button";
}) {
  const trigger =
    variant === "icon" ? (
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        disabled={disabled}
      >
        <MoreHorizontal className="size-4" />
      </Button>
    ) : (
      <Button
        variant="outline"
        size="sm"
        className="h-8 rounded-xl text-xs gap-1"
        disabled={disabled}
      >
        <MoreHorizontal className="size-3" />
        {labels.actions.menu}
      </Button>
    );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 rounded-xl shadow-md">
        {reservation.status === "PENDING" && (
          <DropdownMenuItem
            className="rounded-lg py-2"
            onSelect={() => onUpdateStatus("CONFIRMED")}
          >
            <CheckCircle2 className="size-4 mr-2 text-blue-500" />
            {labels.actions.confirm}
          </DropdownMenuItem>
        )}
        {reservation.status === "CONFIRMED" && (
          <DropdownMenuItem
            className="rounded-lg py-2"
            onSelect={() => onUpdateStatus("SEATED")}
          >
            <UserCheck className="size-4 mr-2 text-purple-500" />
            {labels.actions.seat}
          </DropdownMenuItem>
        )}
        {reservation.status === "SEATED" && (
          <DropdownMenuItem
            className="rounded-lg py-2"
            onSelect={() => onUpdateStatus("COMPLETED")}
          >
            <Check className="size-4 mr-2 text-emerald-500" />
            {labels.actions.complete}
          </DropdownMenuItem>
        )}
        {(reservation.status === "PENDING" ||
          reservation.status === "CONFIRMED") && (
          <DropdownMenuItem
            className="rounded-lg py-2"
            onSelect={() => onUpdateStatus("NO_SHOW")}
          >
            <UserMinus className="size-4 mr-2 text-zinc-500" />
            {labels.actions.noShow}
          </DropdownMenuItem>
        )}
        {reservation.status !== "COMPLETED" &&
          reservation.status !== "CANCELLED" && (
            <DropdownMenuItem
              className="rounded-lg py-2 text-red-500 focus:text-red-500 focus:bg-red-500/10"
              onSelect={() => onUpdateStatus("CANCELLED")}
            >
              <XSquare className="size-4 mr-2" />
              {labels.actions.cancel}
            </DropdownMenuItem>
          )}

        <DropdownMenuSeparator className="opacity-50" />

        <DropdownMenuItem className="rounded-lg py-2" onSelect={onEdit}>
          <Edit className="size-4 mr-2 text-muted-foreground" />
          {labels.actions.edit}
        </DropdownMenuItem>

        <DropdownMenuSeparator className="opacity-50" />

        <DropdownMenuItem
          className="rounded-lg py-2 text-red-500 focus:text-red-500 focus:bg-red-500/10"
          onSelect={onDelete}
        >
          <Trash2 className="size-4 mr-2" />
          {labels.actions.delete}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
