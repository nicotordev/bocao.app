"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { ListPagination } from "@/components/dashboard/list-pagination";
import { QueryResultState } from "@/components/query/query-result-state";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { computeOrdersKpis } from "@/lib/orders/compute-kpis";
import { computeOrdersKpiTrends } from "@/lib/orders/compute-kpi-trends";
import {
  createDefaultOrdersDateRange,
  isOrdersDefaultDateRange,
} from "@/lib/orders/date";
import {
  areOrdersListFiltersEqual,
  buildOrdersListHref,
  buildTargetOrdersListFilters,
  parseOrdersListSearchParams,
  toOrdersKpiFilters,
  type OrdersListFilterPatch,
  type OrdersListFilters,
} from "@/lib/orders/filters";
import {
  buildOrdersCsv,
  buildOrdersCsvFilename,
  downloadCsvFile,
} from "@/lib/orders/export-orders-csv";
import {
  useDeleteOrderMutation,
  useDuplicateOrderMutation,
  useUpdateOrderStatusMutation,
} from "@/lib/query/orders/orders.mutations";
import { useOrdersRealtime } from "@/lib/query/orders/use-orders-realtime";
import {
  useOrdersBoardQuery,
  useOrdersKpiQuery,
  useOrdersListQuery,
} from "@/lib/query/orders/orders.queries";
import { DebouncedSearchDraft } from "@/components/dashboard/url-synced-draft";
import { replaceListHrefIfChanged } from "@/lib/list-url";
import { AiOrderInsights } from "./ai-order-insights";
import { OrderDetailsDialog } from "./order-details-dialog";
import { OrdersFilters, type OrdersFiltersState } from "./orders-filters";
import { OrdersHeader } from "./orders-header";
import { OrdersKanban } from "./orders-kanban";
import { OrdersKpis } from "./orders-kpis";
import { OrdersTable } from "./orders-table";
import { OrdersTimeline } from "./orders-timeline";
import type { DashboardOrder, OrderStatus, OrdersLabels } from "./types";

type OrdersPageClientProps = {
  labels: OrdersLabels;
  restaurantId: string;
  restaurants: string[];
  timezone: string;
  initialOrder?: DashboardOrder | null;
};

export function OrdersPageClient({
  labels,
  restaurantId,
  restaurants,
  timezone,
  initialOrder = null,
}: OrdersPageClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchParamsString = searchParams.toString();
  const openedViaDeepLink = useRef(Boolean(initialOrder));
  const urlOrderId = searchParams.get("orderId") || searchParams.get("created");
  const [isDeepLinkDismissed, setIsDeepLinkDismissed] = useState(false);

  const updateOrderStatusMutation = useUpdateOrderStatusMutation(restaurantId);
  const duplicateOrderMutation = useDuplicateOrderMutation(restaurantId);
  const deleteOrderMutation = useDeleteOrderMutation(restaurantId);

  const deepLinkOrder = useMemo(() => {
    if (isDeepLinkDismissed || !urlOrderId || !initialOrder) {
      return null;
    }

    return initialOrder.id === urlOrderId ? initialOrder : null;
  }, [initialOrder, isDeepLinkDismissed, urlOrderId]);

  const [isManualDialogOpen, setIsManualDialogOpen] = useState(false);
  const [manualOrder, setManualOrder] = useState<DashboardOrder | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [pendingDuplicateOrderId, setPendingDuplicateOrderId] = useState<
    string | null
  >(null);
  const [pendingCancelOrderId, setPendingCancelOrderId] = useState<
    string | null
  >(null);
  const [pendingDeleteOrderId, setPendingDeleteOrderId] = useState<
    string | null
  >(null);
  const [pendingBoardStatuses, setPendingBoardStatuses] = useState<
    Record<string, OrderStatus>
  >({});
  const dialogOrder = isManualDialogOpen ? manualOrder : deepLinkOrder;
  const isDialogOpen = isManualDialogOpen || deepLinkOrder !== null;

  const handleSelectOrder = useCallback(
    (order: DashboardOrder, edit?: boolean) => {
      openedViaDeepLink.current = false;
      setIsDeepLinkDismissed(false);
      setManualOrder(order);
      setIsManualDialogOpen(true);
      setIsEditMode(!!edit);
    },
    [],
  );

  const handleDuplicateOrder = useCallback(
    async (orderId: string) => {
      try {
        const result = await duplicateOrderMutation.mutateAsync(orderId);
        toast.success(
          labels.realtime.connected ? "Order duplicated" : "Pedido duplicado",
        );
        setPendingDuplicateOrderId((current) =>
          current === orderId ? null : current,
        );
        if (result.order) {
          router.push(
            buildOrdersListHref(filters, timezone, {
              created: result.order.id,
            }),
          );
        }
      } catch {
        toast.error("Error duplicating order");
      }
    },
    [duplicateOrderMutation, router, labels],
  );

  const handleDeleteOrder = useCallback(
    async (orderId: string) => {
      try {
        await deleteOrderMutation.mutateAsync(orderId);
        toast.success("Order deleted");
        setManualOrder((current) => (current?.id === orderId ? null : current));
        setIsManualDialogOpen((current) => (current ? false : current));
        setPendingDeleteOrderId((current) =>
          current === orderId ? null : current,
        );
      } catch {
        toast.error("Error deleting order");
      }
    },
    [deleteOrderMutation],
  );

  const handleCancelOrder = useCallback(
    async (orderId: string) => {
      try {
        await updateOrderStatusMutation.mutateAsync({
          orderId,
          status: "cancelled",
        });
        toast.success("Order cancelled");
        setPendingCancelOrderId((current) =>
          current === orderId ? null : current,
        );
      } catch {
        toast.error("Error cancelling order");
      }
    },
    [updateOrderStatusMutation],
  );

  const [activeTab, setActiveTab] = useState("orders");
  const filters = useMemo(
    () =>
      parseOrdersListSearchParams(
        Object.fromEntries(new URLSearchParams(searchParamsString).entries()),
        timezone,
      ),
    [searchParamsString, timezone],
  );

  useEffect(() => {
    setIsDeepLinkDismissed(false);
  }, [urlOrderId]);

  const urlSearch = filters.search ?? "";

  const kpiFilters = useMemo(() => toOrdersKpiFilters(filters), [filters]);
  const isViewingToday = isOrdersDefaultDateRange(
    filters.from ?? "",
    filters.to ?? "",
    timezone,
  );
  const ordersQuery = useOrdersListQuery(restaurantId, filters);
  const boardQuery = useOrdersBoardQuery(restaurantId, filters);
  const kpiQuery = useOrdersKpiQuery(restaurantId, kpiFilters);
  const { connectionState } = useOrdersRealtime({
    restaurantId,
    listFilters: filters,
    boardFilters: filters,
    kpiFilters,
    enabled: restaurantId.length > 0 && !ordersQuery.isError && isViewingToday,
  });

  const listOrders = ordersQuery.data?.orders ?? [];
  const boardOrders = boardQuery.data?.orders ?? [];
  const kanbanOrders = useMemo(
    () =>
      boardOrders.map((order) => {
        const optimisticStatus = pendingBoardStatuses[order.id];

        if (!optimisticStatus || optimisticStatus === order.status) {
          return order;
        }

        return { ...order, status: optimisticStatus };
      }),
    [boardOrders, pendingBoardStatuses],
  );
  const pagination = ordersQuery.data?.pagination ?? {
    page: filters.page,
    pageSize: filters.pageSize,
    total: 0,
    totalPages: 1,
  };

  useEffect(() => {
    setPendingBoardStatuses((current) => {
      const entries = Object.entries(current);

      if (entries.length === 0) {
        return current;
      }

      let changed = false;
      const next = { ...current };

      for (const [orderId, optimisticStatus] of entries) {
        const boardOrder = boardOrders.find((order) => order.id === orderId);

        if (!boardOrder || boardOrder.status === optimisticStatus) {
          delete next[orderId];
          changed = true;
        }
      }

      return changed ? next : current;
    });
  }, [boardOrders]);

  const urlParams = useMemo(() => {
    const params: Record<string, string | undefined> = {
      search: filters.search,
      status: filters.status === "all" ? undefined : filters.status,
      channel: filters.channel === "all" ? undefined : filters.channel,
    };

    if (
      !isOrdersDefaultDateRange(filters.from ?? "", filters.to ?? "", timezone)
    ) {
      params.from = filters.from;
      params.to = filters.to;
    }

    const orderId = searchParams.get("orderId");
    if (orderId) {
      params.orderId = orderId;
    }

    const created = searchParams.get("created");
    if (created) {
      params.created = created;
    }

    return params;
  }, [filters, searchParams, timezone]);

  const clearDeepLinkFromUrl = useCallback(() => {
    if (!searchParams.get("orderId") && !searchParams.get("created")) {
      return;
    }

    openedViaDeepLink.current = false;
    replaceListHrefIfChanged(router, buildOrdersListHref(filters, timezone));
  }, [filters, router, searchParams, timezone]);

  const handleCloseOrderDialog = useCallback(() => {
    const closingManualDialog = isManualDialogOpen;

    setIsManualDialogOpen(false);
    setManualOrder(null);
    setIsEditMode(false);

    if (closingManualDialog) {
      return;
    }

    if (!urlOrderId) {
      return;
    }

    setIsDeepLinkDismissed(true);
    openedViaDeepLink.current = false;
    clearDeepLinkFromUrl();
  }, [clearDeepLinkFromUrl, isManualDialogOpen, urlOrderId]);

  const kpiValues = useMemo(() => {
    const kpiOrders = kpiQuery.data?.orders ?? [];
    const values = computeOrdersKpis(kpiOrders);
    const trends = computeOrdersKpiTrends(kpiOrders, {
      notAvailable: labels.kpis.notAvailable,
      preparingCount: labels.kpis.preparingCount,
      readyCount: labels.kpis.readyCount,
    });

    return { ...values, trends };
  }, [kpiQuery.data?.orders, labels.kpis]);

  const navigateFilters = useCallback(
    (next: OrdersListFilterPatch, options?: { page?: number }) => {
      const targetFilters = buildTargetOrdersListFilters(
        filters,
        next,
        options,
      );

      if (areOrdersListFiltersEqual(filters, targetFilters)) {
        return;
      }

      replaceListHrefIfChanged(
        router,
        buildOrdersListHref(targetFilters, timezone),
      );
    },
    [filters, router, timezone],
  );

  const handleDebouncedSearch = useCallback(
    (search: string) => navigateFilters({ search }),
    [navigateFilters],
  );

  const clearFilters = (setSearchDraft: (value: string) => void) => {
    const { from, to } = createDefaultOrdersDateRange(timezone);
    setSearchDraft("");
    navigateFilters({
      search: "",
      status: "all",
      channel: "all",
      from,
      to,
    });
  };

  const handleExport = () => {
    if (listOrders.length === 0) {
      toast.error(labels.actions.exportEmpty);
      return;
    }

    const csv = buildOrdersCsv(listOrders, {
      columns: {
        id: labels.table.id,
        customer: labels.table.customer,
        phone: labels.drawer.phone,
        table: labels.table.tableNumber,
        channel: labels.table.channel,
        status: labels.table.status,
        total: labels.table.total,
        time: labels.table.time,
        wait: labels.table.wait,
        owner: labels.table.owner,
        items: labels.drawer.products,
        notes: labels.drawer.notes,
      },
      statuses: labels.statuses,
      channels: labels.channels,
      minutes: labels.table.minutes,
    });

    downloadCsvFile(buildOrdersCsvFilename(), csv);
    toast.success(labels.actions.exportSuccess);
  };

  return (
    <DebouncedSearchDraft
      urlSearch={urlSearch}
      onDebouncedChange={handleDebouncedSearch}
    >
      {(searchDraft, setSearchDraft) => {
        const filterState: OrdersFiltersState = {
          search: searchDraft,
          status: filters.status ?? "all",
          channel: filters.channel ?? "all",
          restaurant: restaurants[0] ?? "",
          from: filters.from ?? "",
          to: filters.to ?? "",
        };

        return (
          <main className="flex flex-col gap-6 p-4 md:p-6">
            <OrdersHeader
              labels={labels}
              connectionState={connectionState}
              onExport={handleExport}
              onRefresh={() => {
                void Promise.all([
                  ordersQuery.refetch(),
                  boardQuery.refetch(),
                  kpiQuery.refetch(),
                ]);
              }}
              isRefreshing={
                (ordersQuery.isFetching && !ordersQuery.isPending) ||
                (boardQuery.isFetching && !boardQuery.isPending) ||
                (kpiQuery.isFetching && !kpiQuery.isPending)
              }
            />
            <OrdersKpis labels={labels.kpis} values={kpiValues} />
            <AiOrderInsights
              labels={labels.insights}
              items={ordersQuery.data?.insights}
            />

            <QueryResultState query={ordersQuery}>
              {() => (
                <>
                  <OrdersFilters
                    labels={labels}
                    restaurants={restaurants}
                    timezone={timezone}
                    value={filterState}
                    onSearchChange={setSearchDraft}
                    onFiltersChange={(value) => {
                      navigateFilters({
                        status: value.status,
                        channel: value.channel,
                        from: value.from,
                        to: value.to,
                      });
                    }}
                    onClear={() => clearFilters(setSearchDraft)}
                  />

                  <Tabs
                    value={activeTab}
                    onValueChange={setActiveTab}
                    className="min-w-0"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <TabsList>
                        <TabsTrigger value="orders">
                          {labels.tabs.orders}
                        </TabsTrigger>
                        <TabsTrigger value="kanban">
                          {labels.tabs.kanban}
                        </TabsTrigger>
                        <TabsTrigger value="timeline">
                          {labels.tabs.timeline}
                        </TabsTrigger>
                      </TabsList>
                    </div>

                    <TabsContent value="orders" className="mt-4 space-y-4">
                      <OrdersTable
                        labels={labels}
                        orders={listOrders}
                        onSelectOrder={handleSelectOrder}
                        onDuplicateOrder={setPendingDuplicateOrderId}
                        onCancelOrder={setPendingCancelOrderId}
                        onDeleteOrder={setPendingDeleteOrderId}
                      />
                      <ListPagination
                        basePath="/dashboard/orders"
                        params={urlParams}
                        meta={pagination}
                        labels={labels.pagination}
                      />
                    </TabsContent>
                    <TabsContent value="kanban" className="mt-4">
                      <OrdersKanban
                        labels={labels}
                        orders={kanbanOrders}
                        onSelectOrder={handleSelectOrder}
                        isMoving={updateOrderStatusMutation.isPending}
                        showDragGuide={activeTab === "kanban"}
                        onMoveOrder={(orderId, status) => {
                          setPendingBoardStatuses((current) => ({
                            ...current,
                            [orderId]: status,
                          }));
                          updateOrderStatusMutation.mutate(
                            { orderId, status },
                            {
                              onError: () => {
                                setPendingBoardStatuses((current) => {
                                  if (!(orderId in current)) {
                                    return current;
                                  }

                                  const next = { ...current };
                                  delete next[orderId];
                                  return next;
                                });
                              },
                            },
                          );
                        }}
                      />
                    </TabsContent>
                    <TabsContent value="timeline" className="mt-4">
                      <OrdersTimeline
                        labels={labels}
                        orders={kanbanOrders}
                        onSelectOrder={handleSelectOrder}
                      />
                    </TabsContent>
                  </Tabs>
                </>
              )}
            </QueryResultState>

            <OrderDetailsDialog
              labels={labels}
              restaurantId={restaurantId}
              order={dialogOrder}
              open={isDialogOpen}
              isEditMode={isEditMode}
              onEditModeChange={setIsEditMode}
              onOpenChange={(open) => {
                if (!open) {
                  handleCloseOrderDialog();
                }
              }}
            />
            <ConfirmDialog
              open={pendingDuplicateOrderId !== null}
              onOpenChange={(open) => {
                if (!open && !duplicateOrderMutation.isPending) {
                  setPendingDuplicateOrderId(null);
                }
              }}
              title={labels.actions.duplicate}
              description={labels.drawer.confirmDuplicate}
              confirmLabel={labels.actions.duplicate}
              cancelLabel={labels.actions.cancel}
              onConfirm={() => {
                if (pendingDuplicateOrderId) {
                  void handleDuplicateOrder(pendingDuplicateOrderId);
                }
              }}
              isPending={duplicateOrderMutation.isPending}
            />
            <ConfirmDialog
              open={pendingCancelOrderId !== null}
              onOpenChange={(open) => {
                if (!open && !updateOrderStatusMutation.isPending) {
                  setPendingCancelOrderId(null);
                }
              }}
              title={labels.actions.cancel}
              description={labels.drawer.confirmCancel}
              confirmLabel={labels.actions.cancel}
              cancelLabel={labels.actions.cancel}
              onConfirm={() => {
                if (pendingCancelOrderId) {
                  void handleCancelOrder(pendingCancelOrderId);
                }
              }}
              isPending={updateOrderStatusMutation.isPending}
            />
            <ConfirmDialog
              open={pendingDeleteOrderId !== null}
              onOpenChange={(open) => {
                if (!open && !deleteOrderMutation.isPending) {
                  setPendingDeleteOrderId(null);
                }
              }}
              title={labels.actions.delete}
              description={labels.drawer.confirmDelete}
              confirmLabel={labels.actions.delete}
              cancelLabel={labels.actions.cancel}
              onConfirm={() => {
                if (pendingDeleteOrderId) {
                  void handleDeleteOrder(pendingDeleteOrderId);
                }
              }}
              isPending={deleteOrderMutation.isPending}
            />
          </main>
        );
      }}
    </DebouncedSearchDraft>
  );
}
