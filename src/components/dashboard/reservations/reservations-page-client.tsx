"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useRef, useState } from "react";
import { DebouncedSearchDraft } from "@/components/dashboard/url-synced-draft";
import { toast } from "sonner";
import { ListPagination } from "@/components/dashboard/list-pagination";
import { useReservationsListQuery } from "@/lib/query/reservations/reservations.queries";
import {
  useCreateReservationMutation,
  useUpdateReservationMutation,
  useDeleteReservationMutation,
} from "@/lib/query/reservations/reservations.mutations";
import { QueryResultState } from "@/components/query/query-result-state";
import { buildListUrl } from "@/lib/list-url";
import { parseReservationsListSearchParams } from "@/lib/reservations/filters";
import { ReservationsHeader } from "./reservations-header";
import { ReservationsKpis } from "./reservations-kpis";
import { ReservationsFilters } from "./reservations-filters";
import { ReservationsTable } from "./reservations-table";
import { ReservationDialog } from "./reservation-dialog";
import type { ReservationFormSubmitData } from "./reservation-dialog.types";
import type {
  Reservation,
  ReservationsKpiValues,
  ReservationStatus,
} from "@/lib/reservations/types";
import type { ReservationsPageLabels } from "@/lib/reservations/page-labels";
import type { CustomerOption } from "@/lib/customers/types";
import { startOfDay } from "date-fns";

type ReservationsPageClientProps = {
  labels: ReservationsPageLabels;
  restaurantId: string;
  customers: CustomerOption[];
  initialReservation?: Reservation | null;
  initialKpis?: ReservationsKpiValues | null;
};

export function ReservationsPageClient({
  labels,
  restaurantId,
  customers,
  initialReservation = null,
  initialKpis = null,
}: ReservationsPageClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const openedViaDeepLink = useRef(Boolean(initialReservation));
  const filters = useMemo(
    () =>
      parseReservationsListSearchParams(
        Object.fromEntries(searchParams.entries()),
      ),
    [searchParams],
  );

  const urlSearch = filters.search ?? "";
  const urlReservationId = searchParams.get("reservationId");
  const deepLinkReservation =
    urlReservationId &&
    initialReservation &&
    initialReservation.id === urlReservationId
      ? initialReservation
      : null;

  const [manualReservation, setManualReservation] =
    useState<Reservation | null>(null);
  const [isManualDialogOpen, setIsManualDialogOpen] = useState(false);

  const dialogReservation = isManualDialogOpen
    ? manualReservation
    : deepLinkReservation;
  const isDialogOpen = isManualDialogOpen || Boolean(deepLinkReservation);

  const reservationsQuery = useReservationsListQuery(restaurantId, filters);

  const createMutation = useCreateReservationMutation(restaurantId);
  const updateMutation = useUpdateReservationMutation(restaurantId);
  const deleteMutation = useDeleteReservationMutation(restaurantId);

  const list = reservationsQuery.data?.reservations ?? [];
  const pagination = reservationsQuery.data?.pagination ?? {
    page: filters.page,
    pageSize: filters.pageSize,
    total: 0,
    totalPages: 1,
  };

  const dateFilter = useMemo(() => {
    if (!filters.from) {
      return undefined;
    }

    return new Date(filters.from);
  }, [filters.from]);

  const urlParams = useMemo(() => {
    const params: Record<string, string | undefined> = {
      search: filters.search,
      status: filters.status === "all" ? undefined : filters.status,
      from: filters.from,
      to: filters.to,
    };

    const reservationId = searchParams.get("reservationId");
    if (reservationId) {
      params.reservationId = reservationId;
    }

    return params;
  }, [filters, searchParams]);

  const kpis = initialKpis ?? {
    total: 0,
    confirmed: 0,
    pending: 0,
    guests: 0,
  };

  const navigateFilters = useCallback(
    (
      next: {
        search?: string;
        status?: string;
        date?: Date | undefined;
      },
      options?: { page?: number },
    ) => {
      const nextFrom = next.date
        ? startOfDay(next.date).toISOString()
        : filters.from;
      const nextTo = next.date
        ? new Date(
            startOfDay(next.date).getTime() + 24 * 60 * 60 * 1000 - 1,
          ).toISOString()
        : filters.to;

      router.push(
        buildListUrl(
          "/dashboard/reservations",
          {
            search: next.search ?? filters.search,
            status:
              (next.status ?? filters.status) === "all"
                ? undefined
                : (next.status ?? filters.status),
            from:
              next.date === undefined && "date" in next ? undefined : nextFrom,
            to: next.date === undefined && "date" in next ? undefined : nextTo,
            reservationId: searchParams.get("reservationId") ?? undefined,
          },
          {
            page: options?.page ?? 1,
            pageSize: filters.pageSize,
          },
        ),
      );
    },
    [filters, router, searchParams],
  );

  const handleCreate = () => {
    setManualReservation(null);
    setIsManualDialogOpen(true);
  };

  const handleEdit = (reservation: Reservation) => {
    setManualReservation(reservation);
    setIsManualDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsManualDialogOpen(false);
    setManualReservation(null);

    if (deepLinkReservation || openedViaDeepLink.current) {
      openedViaDeepLink.current = false;
      router.replace(
        buildListUrl(
          "/dashboard/reservations",
          {
            search: filters.search,
            status: filters.status === "all" ? undefined : filters.status,
            from: filters.from,
            to: filters.to,
          },
          {
            page: filters.page,
            pageSize: filters.pageSize,
          },
        ),
      );
    }
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
          toast.error(labels.form.errorUpdateStatus);
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
        toast.error(labels.form.errorDelete);
      },
    });
  };

  const handleDebouncedSearch = useCallback(
    (search: string) => navigateFilters({ search }),
    [navigateFilters],
  );

  const handleSubmit = (data: ReservationFormSubmitData) => {
    if (dialogReservation) {
      updateMutation.mutate(
        { reservationId: dialogReservation.id, input: data },
        {
          onSuccess: () => {
            toast.success(labels.form.successUpdate);
            handleCloseDialog();
          },
          onError: () => {
            toast.error(labels.form.errorUpdate);
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
          toast.error(labels.form.errorCreate);
        },
      });
    }
  };

  return (
    <DebouncedSearchDraft
      key={urlSearch}
      urlSearch={urlSearch}
      onDebouncedChange={handleDebouncedSearch}
    >
      {(searchDraft, setSearchDraft) => (
        <main className="flex flex-col gap-6 p-4 md:p-6">
          <ReservationsHeader
            labels={labels}
            onNew={handleCreate}
            onRefresh={() => void reservationsQuery.refetch()}
            isRefreshing={
              reservationsQuery.isFetching && !reservationsQuery.isPending
            }
          />

          <ReservationsKpis labels={labels.kpis} values={kpis} />

          <ReservationsFilters
            labels={labels}
            search={searchDraft}
            onSearchChange={setSearchDraft}
            status={filters.status ?? "all"}
            onStatusChange={(status) => navigateFilters({ status })}
            date={dateFilter}
            onDateChange={(date) => navigateFilters({ date })}
            onClear={() => {
              setSearchDraft("");
              navigateFilters({ search: "", status: "all", date: undefined });
            }}
          />

          <QueryResultState query={reservationsQuery}>
            {() => (
              <div className="space-y-4">
                <ReservationsTable
                  labels={labels}
                  reservations={list}
                  onEdit={handleEdit}
                  onUpdateStatus={handleStatusChange}
                  onDelete={handleDelete}
                  isUpdating={
                    updateMutation.isPending || deleteMutation.isPending
                  }
                />
                <ListPagination
                  basePath="/dashboard/reservations"
                  params={urlParams}
                  meta={pagination}
                  labels={labels.pagination}
                />
              </div>
            )}
          </QueryResultState>

          <ReservationDialog
            labels={labels}
            customers={customers}
            open={isDialogOpen}
            onOpenChange={(open) => {
              if (!open) {
                handleCloseDialog();
                return;
              }
              setIsManualDialogOpen(true);
            }}
            onClose={handleCloseDialog}
            reservation={dialogReservation}
            onSubmit={handleSubmit}
            isSubmitting={createMutation.isPending || updateMutation.isPending}
          />
        </main>
      )}
    </DebouncedSearchDraft>
  );
}
