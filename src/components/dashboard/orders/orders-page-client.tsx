"use client";

import { useMemo, useState } from "react";
import { QueryResultState } from "@/components/query/query-result-state";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
};

export function OrdersPageClient({
  labels,
  restaurantId,
  restaurants,
}: OrdersPageClientProps) {
  const [selectedOrder, setSelectedOrder] = useState<DashboardOrder | null>(
    null,
  );
  const [filters, setFilters] = useState<OrdersFiltersState>({
    search: "",
    status: "all",
    channel: "all",
    restaurant: restaurants[0] ?? "",
    from: "",
    to: "",
    expanded: false,
  });

  const ordersQuery = useOrdersListQuery(restaurantId);
  const updateOrderStatusMutation = useUpdateOrderStatusMutation(restaurantId);

  const filteredOrders = useMemo(() => {
    const orders = ordersQuery.data?.orders ?? [];

    return applyOrdersListFilters(orders, {
      search: filters.search,
      status: filters.status,
      channel: filters.channel,
    });
  }, [
    filters.channel,
    filters.search,
    filters.status,
    ordersQuery.data?.orders,
  ]);

  const clearFilters = () =>
    setFilters((current) => ({
      ...current,
      search: "",
      status: "all",
      channel: "all",
      from: "",
      to: "",
    }));

  return (
    <main className="flex flex-col gap-6 p-4 md:p-6">
      <OrdersHeader
        labels={labels}
        onRefresh={() => {
          void ordersQuery.refetch();
        }}
        isRefreshing={ordersQuery.isFetching && !ordersQuery.isPending}
      />
      <OrdersKpis labels={labels.kpis} />

      <QueryResultState query={ordersQuery}>
        {() => (
          <>
            <OrdersFilters
              labels={labels}
              restaurants={restaurants}
              value={filters}
              onChange={setFilters}
              onClear={clearFilters}
            />

            <div className="grid gap-4 2xl:grid-cols-[minmax(0,1fr)_360px]">
              <Tabs defaultValue="orders" className="min-w-0">
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

              <aside className="2xl:sticky 2xl:top-32 2xl:self-start">
                <AiOrderInsights labels={labels.insights} />
              </aside>
            </div>
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
