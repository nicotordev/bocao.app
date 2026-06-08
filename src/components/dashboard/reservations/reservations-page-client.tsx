"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useReservationsListQuery } from "@/lib/query/reservations/reservations.queries";
import {
  useCreateReservationMutation,
  useUpdateReservationMutation,
  useDeleteReservationMutation,
} from "@/lib/query/reservations/reservations.mutations";
import { QueryResultState } from "@/components/query/query-result-state";
import { ReservationsHeader } from "./reservations-header";
import { ReservationsKpis } from "./reservations-kpis";
import { ReservationsFilters } from "./reservations-filters";
import { ReservationsTable } from "./reservations-table";
import { ReservationDialog } from "./reservation-dialog";
import type { ReservationFormSubmitData } from "./reservation-dialog.types";
import type { Reservation, ReservationStatus } from "@/lib/reservations/types";
import type { CustomerOption } from "@/lib/customers/types";
import { format, startOfDay } from "date-fns";

type ReservationsPageClientProps = {
  labels: any;
  restaurantId: string;
  customers: CustomerOption[];
};

export function ReservationsPageClient({
  labels,
  restaurantId,
  customers,
}: ReservationsPageClientProps) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [date, setDate] = useState<Date | undefined>(undefined);

  const [activeReservation, setActiveReservation] = useState<Reservation | null>(
    null,
  );
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const filters = useMemo(() => {
    return {
      search,
      status,
      from: date ? startOfDay(date).toISOString() : undefined,
      to: date
        ? new Date(startOfDay(date).getTime() + 24 * 60 * 60 * 1000 - 1).toISOString()
        : undefined,
    };
  }, [search, status, date]);

  const reservationsQuery = useReservationsListQuery(restaurantId, filters);

  const createMutation = useCreateReservationMutation(restaurantId);
  const updateMutation = useUpdateReservationMutation(restaurantId);
  const deleteMutation = useDeleteReservationMutation(restaurantId);

  const list = reservationsQuery.data?.reservations ?? [];

  const kpis = useMemo(() => {
    const today = new Date();
    const todayStr = format(today, "yyyy-MM-dd");

    const todayReservations = list.filter((r) =>
      r.scheduledAt.startsWith(todayStr),
    );

    const total = todayReservations.length;
    const confirmed = todayReservations.filter(
      (r) =>
        r.status === "CONFIRMED" ||
        r.status === "SEATED" ||
        r.status === "COMPLETED",
    ).length;
    const pending = todayReservations.filter((r) => r.status === "PENDING").length;
    const guests = todayReservations
      .filter((r) => r.status !== "CANCELLED" && r.status !== "NO_SHOW")
      .reduce((sum, r) => sum + r.guestCount, 0);

    return { total, confirmed, pending, guests };
  }, [list]);

  const handleCreate = () => {
    setActiveReservation(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (reservation: Reservation) => {
    setActiveReservation(reservation);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setActiveReservation(null);
  };

  const handleStatusChange = (
    reservationId: string,
    nextStatus: ReservationStatus,
  ) => {
    updateMutation.mutate(
      { reservationId, input: { status: nextStatus } },
      {
        onSuccess: () => {
          toast.success(labels.form.successUpdate);
        },
        onError: () => {
          toast.error("Error al actualizar el estado de la reserva");
        },
      },
    );
  };

  const handleDelete = (reservationId: string) => {
    deleteMutation.mutate(reservationId, {
      onSuccess: () => {
        toast.success(labels.form.successDelete);
      },
      onError: () => {
        toast.error("Error al eliminar la reserva");
      },
    });
  };

  const handleSubmit = (data: ReservationFormSubmitData) => {
    if (activeReservation) {
      updateMutation.mutate(
        { reservationId: activeReservation.id, input: data },
        {
          onSuccess: () => {
            toast.success(labels.form.successUpdate);
            handleCloseDialog();
          },
          onError: () => {
            toast.error("Error al actualizar la reserva");
          },
        },
      );
    } else {
      createMutation.mutate(data, {
        onSuccess: (response) => {
          const count = response.reservations.length;
          toast.success(
            count > 1
              ? labels.form.successCreateMultiple.replace(
                  "{count}",
                  String(count),
                )
              : labels.form.successCreate,
          );
          handleCloseDialog();
        },
        onError: () => {
          toast.error("Error al crear la reserva");
        },
      });
    }
  };

  return (
    <main className="flex flex-col gap-6 p-4 md:p-6">
      <ReservationsHeader
        labels={labels}
        onNew={handleCreate}
        onRefresh={() => void reservationsQuery.refetch()}
        isRefreshing={reservationsQuery.isFetching && !reservationsQuery.isPending}
      />

      <ReservationsKpis labels={labels.kpis} values={kpis} />

      <ReservationsFilters
        labels={labels}
        search={search}
        onSearchChange={setSearch}
        status={status}
        onStatusChange={setStatus}
        date={date}
        onDateChange={setDate}
        onClear={() => {
          setSearch("");
          setStatus("all");
          setDate(undefined);
        }}
      />

      <QueryResultState query={reservationsQuery}>
        {() => (
          <ReservationsTable
            labels={labels}
            reservations={list}
            onEdit={handleEdit}
            onUpdateStatus={handleStatusChange}
            onDelete={handleDelete}
            isUpdating={updateMutation.isPending || deleteMutation.isPending}
          />
        )}
      </QueryResultState>

      <ReservationDialog
        labels={labels}
        customers={customers}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onClose={handleCloseDialog}
        reservation={activeReservation}
        onSubmit={handleSubmit}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
      />
    </main>
  );
}
