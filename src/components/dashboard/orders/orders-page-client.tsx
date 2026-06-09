"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { QueryResultState } from "@/components/query/query-result-state";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { computeOrdersKpis } from "@/lib/orders/compute-kpis";
import { computeOrdersKpiTrends } from "@/lib/orders/compute-kpi-trends";
import {
  buildOrdersCsv,
  buildOrdersCsvFilename,
  downloadCsvFile,
} from "@/lib/orders/export-orders-csv";
import { createDefaultOrdersDateRange } from "@/lib/orders/date";
import { applyOrdersListFilters } from "@/lib/orders/filters";
import { useUpdateOrderStatusMutation } from "@/lib/query/orders/orders.mutations";
import { useOrdersListQuery } from "@/lib/query/orders/orders.queries";
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
};

export function OrdersPageClient({
  labels,
  restaurantId,
  restaurants,
  timezone,
}: OrdersPageClientProps) {
  const [selectedOrder, setSelectedOrder] = useState<DashboardOrder | null>(
    null,
  );
  const [activeTab, setActiveTab] = useState("orders");
  const [filters, setFilters] = useState<OrdersFiltersState>(() => {
    const { from, to } = createDefaultOrdersDateRange(timezone);

    return {
      search: "",
      status: "all",
      channel: "all",
      restaurant: restaurants[0] ?? "",
      from,
      to,
    };
  });

  const ordersQuery = useOrdersListQuery(restaurantId);
  const updateOrderStatusMutation = useUpdateOrderStatusMutation(restaurantId);

  const allOrders = ordersQuery.data?.orders ?? [];

  const filteredOrders = useMemo(() => {
    return applyOrdersListFilters(allOrders, {
      search: filters.search,
      status: filters.status,
      channel: filters.channel,
      from: filters.from,
      to: filters.to,
    });
  }, [
    allOrders,
    filters.channel,
    filters.from,
    filters.search,
    filters.status,
    filters.to,
  ]);

  const kpiValues = useMemo(() => {
    const values = computeOrdersKpis(allOrders);
    const trends = computeOrdersKpiTrends(allOrders, {
      notAvailable: labels.kpis.notAvailable,
      preparingCount: labels.kpis.preparingCount,
      readyCount: labels.kpis.readyCount,
    });

    return { ...values, trends };
  }, [allOrders, labels.kpis]);

  const clearFilters = () => {
    const { from, to } = createDefaultOrdersDateRange(timezone);

    setFilters((current) => ({
      ...current,
      search: "",
      status: "all",
      channel: "all",
      from,
      to,
    }));
  };

  const handleExport = () => {
    if (filteredOrders.length === 0) {
      toast.error(labels.actions.exportEmpty);
      return;
    }

    const csv = buildOrdersCsv(filteredOrders, {
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
    <main className="flex flex-col gap-6 p-4 md:p-6">
      <OrdersHeader
        labels={labels}
        onExport={handleExport}
        onRefresh={() => {
          void ordersQuery.refetch();
        }}
        isRefreshing={ordersQuery.isFetching && !ordersQuery.isPending}
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
              value={filters}
              onChange={setFilters}
              onClear={clearFilters}
            />

            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="min-w-0"
            >
              <div className="flex items-center justify-between gap-3">
                <TabsList>
                  <TabsTrigger value="orders">{labels.tabs.orders}</TabsTrigger>
                  <TabsTrigger value="kanban">{labels.tabs.kanban}</TabsTrigger>
                  <TabsTrigger value="timeline">
                    {labels.tabs.timeline}
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="orders" className="mt-4">
                <OrdersTable
                  labels={labels}
                  orders={filteredOrders}
                  onSelectOrder={setSelectedOrder}
                />
              </TabsContent>
              <TabsContent value="kanban" className="mt-4">
                <OrdersKanban
                  labels={labels}
                  orders={filteredOrders}
                  onSelectOrder={setSelectedOrder}
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
                  orders={filteredOrders}
                  onSelectOrder={setSelectedOrder}
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
          if (!open) setSelectedOrder(null);
        }}
      />
    </main>
  );
}
