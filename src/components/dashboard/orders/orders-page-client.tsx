"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { ListPagination } from "@/components/dashboard/list-pagination";
import { QueryResultState } from "@/components/query/query-result-state";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { buildListUrl } from "@/lib/list-url";
import { computeOrdersKpis } from "@/lib/orders/compute-kpis";
import { computeOrdersKpiTrends } from "@/lib/orders/compute-kpi-trends";
import { createDefaultOrdersDateRange } from "@/lib/orders/date";
import {
  parseOrdersListSearchParams,
  toOrdersKpiFilters,
  type OrdersListFilters,
} from "@/lib/orders/filters";
import {
  buildOrdersCsv,
  buildOrdersCsvFilename,
  downloadCsvFile,
} from "@/lib/orders/export-orders-csv";
import { useUpdateOrderStatusMutation } from "@/lib/query/orders/orders.mutations";
import {
  useOrdersBoardQuery,
  useOrdersKpiQuery,
  useOrdersListQuery,
} from "@/lib/query/orders/orders.queries";
import { DebouncedSearchDraft } from "@/components/dashboard/url-synced-draft";
import { AiOrderInsights } from "./ai-order-insights";
import { OrderDetailsDrawer } from "./order-details-drawer";
import { OrdersFilters, type OrdersFiltersState } from "./orders-filters";
import { OrdersHeader } from "./orders-header";
import { OrdersKanban } from "./orders-kanban";
import { OrdersKpis } from "./orders-kpis";
import { OrdersTable } from "./orders-table";
import { OrdersTimeline } from "./orders-timeline";
import type { DashboardOrder, OrdersLabels } from "./types";

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
  const openedViaDeepLink = useRef(Boolean(initialOrder));
  const urlOrderId = searchParams.get("orderId");

  const deepLinkOrder = useMemo(() => {
    if (!urlOrderId || !initialOrder) {
      return null;
    }

    return initialOrder.id === urlOrderId ? initialOrder : null;
  }, [initialOrder, urlOrderId]);

  const [manualOrder, setManualOrder] = useState<DashboardOrder | null>(null);
  const selectedOrder = manualOrder ?? deepLinkOrder;
  const [activeTab, setActiveTab] = useState("orders");
  const filters = useMemo(
    () =>
      parseOrdersListSearchParams(
        Object.fromEntries(searchParams.entries()),
        timezone,
      ),
    [searchParams, timezone],
  );

  const urlSearch = filters.search ?? "";

  const kpiFilters = useMemo(() => toOrdersKpiFilters(filters), [filters]);
  const ordersQuery = useOrdersListQuery(restaurantId, filters);
  const boardQuery = useOrdersBoardQuery(restaurantId, filters);
  const kpiQuery = useOrdersKpiQuery(restaurantId, kpiFilters);
  const updateOrderStatusMutation = useUpdateOrderStatusMutation(restaurantId);

  const listOrders = ordersQuery.data?.orders ?? [];
  const boardOrders = boardQuery.data?.orders ?? [];
  const pagination = ordersQuery.data?.pagination ?? {
    page: filters.page,
    pageSize: filters.pageSize,
    total: 0,
    totalPages: 1,
  };

  const urlParams = useMemo(() => {
    const params: Record<string, string | undefined> = {
      search: filters.search,
      status: filters.status === "all" ? undefined : filters.status,
      channel: filters.channel === "all" ? undefined : filters.channel,
      from: filters.from,
      to: filters.to,
    };

    const orderId = searchParams.get("orderId");
    if (orderId) {
      params.orderId = orderId;
    }

    return params;
  }, [filters, searchParams]);

  const clearDeepLinkFromUrl = useCallback(() => {
    if (!searchParams.get("orderId")) {
      return;
    }

    openedViaDeepLink.current = false;
    router.replace(
      buildListUrl(
        "/dashboard/orders",
        {
          search: filters.search,
          status: filters.status === "all" ? undefined : filters.status,
          channel: filters.channel === "all" ? undefined : filters.channel,
          from: filters.from,
          to: filters.to,
        },
        {
          page: filters.page,
          pageSize: filters.pageSize,
        },
      ),
    );
  }, [filters, router, searchParams]);

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
    (
      next: Partial<OrdersListFilters & OrdersFiltersState>,
      options?: { page?: number },
    ) => {
      router.push(
        buildListUrl(
          "/dashboard/orders",
          {
            search: next.search ?? filters.search,
            status:
              (next.status ?? filters.status) === "all"
                ? undefined
                : (next.status ?? filters.status),
            channel:
              (next.channel ?? filters.channel) === "all"
                ? undefined
                : (next.channel ?? filters.channel),
            from: next.from ?? filters.from,
            to: next.to ?? filters.to,
          },
          {
            page: options?.page ?? 1,
            pageSize: filters.pageSize,
          },
        ),
      );
    },
    [filters, router],
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
      key={urlSearch}
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
                    onChange={(value) => {
                      setSearchDraft(value.search);
                      navigateFilters({
                        search: value.search,
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
                        onSelectOrder={(order) => {
                          openedViaDeepLink.current = false;
                          setManualOrder(order);
                        }}
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
                        orders={boardOrders}
                        onSelectOrder={(order) => {
                          openedViaDeepLink.current = false;
                          setManualOrder(order);
                        }}
                        isMoving={updateOrderStatusMutation.isPending}
                        showDragGuide={activeTab === "kanban"}
                        onMoveOrder={(orderId, status) =>
                          updateOrderStatusMutation.mutate({ orderId, status })
                        }
                      />
                    </TabsContent>
                    <TabsContent value="timeline" className="mt-4">
                      <OrdersTimeline
                        labels={labels}
                        orders={boardOrders}
                        onSelectOrder={(order) => {
                          openedViaDeepLink.current = false;
                          setManualOrder(order);
                        }}
                      />
                    </TabsContent>
                  </Tabs>
                </>
              )}
            </QueryResultState>

            <OrderDetailsDrawer
              labels={labels}
              order={selectedOrder}
              open={selectedOrder !== null}
              onOpenChange={(open) => {
                if (open) {
                  return;
                }

                setManualOrder(null);

                if (openedViaDeepLink.current) {
                  clearDeepLinkFromUrl();
                }
              }}
            />
          </main>
        );
      }}
    </DebouncedSearchDraft>
  );
}
