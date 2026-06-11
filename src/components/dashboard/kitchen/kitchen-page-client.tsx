"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { QueryErrorState } from "@/components/query/query-result-state";
import { Skeleton } from "@/components/ui/skeleton";
import { applyKitchenFilters, sortKitchenOrders } from "@/lib/kitchen/filters";
import { computeKitchenKpis } from "@/lib/kitchen/compute-kpis";
import { computeKitchenInsights } from "@/lib/kitchen/compute-insights";
import { computeKitchenKpiTrends } from "@/lib/kitchen/compute-kpi-trends";
import {
  createDefaultKitchenDate,
  filterKitchenOrdersByDate,
  isKitchenDefaultDate,
  parseKitchenListSearchParams,
} from "@/lib/kitchen/list-filters";
import { buildListUrl } from "@/lib/list-url";
import type {
  KitchenFiltersState,
  KitchenKanbanStatus,
  KitchenOrder,
  KitchenStation,
  KitchenViewMode,
} from "@/lib/kitchen/types";
import { useUpdateKitchenOrderMutation } from "@/lib/query/kitchen/kitchen.mutations";
import { useKitchenOrdersQuery } from "@/lib/query/kitchen/kitchen.queries";
import { useKitchenRealtime } from "@/lib/query/kitchen/use-kitchen-realtime";
import { useUpdateOrderStatusMutation } from "@/lib/query/orders/orders.mutations";
import { CancelKitchenOrderDialog } from "./cancel-kitchen-order-dialog";
import { KitchenCopilotDialog } from "./kitchen-copilot-dialog";
import { KitchenDetailDialog } from "./kitchen-detail-dialog";
import { KitchenEmptyState } from "./kitchen-empty-state";
import { KitchenHeader } from "./kitchen-header";
import { KitchenKanban } from "./kitchen-kanban";
import { KitchenKpis } from "./kitchen-kpis";
import { KitchenNewOrderDialog } from "./kitchen-new-order-dialog";
import { KitchenTicketCard } from "./kitchen-ticket-card";
import { KitchenTimeline } from "./kitchen-timeline";
import { KitchenToolbar } from "./kitchen-toolbar";
import type { KitchenLabels } from "./types";
import type { NewOrderPageClientProps } from "@/components/dashboard/orders/new/types";

type KitchenPageClientProps = {
  labels: KitchenLabels;
  insightLabels: {
    delayedSla: string;
    averagePrep: string;
    busiestStation: string;
  };
  restaurantId: string;
  timezone: string;
  newOrder: NewOrderPageClientProps;
};

const defaultFilters: KitchenFiltersState = {
  search: "",
  station: "all",
  priority: "all",
  channel: "all",
};

export function KitchenPageClient({
  labels,
  insightLabels,
  restaurantId,
  timezone,
  newOrder,
}: KitchenPageClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isNewOrderOpen, setIsNewOrderOpen] = useState(false);
  const listFilters = useMemo(
    () =>
      parseKitchenListSearchParams(
        Object.fromEntries(searchParams.entries()),
        timezone,
      ),
    [searchParams, timezone],
  );

  const kitchenQuery = useKitchenOrdersQuery(restaurantId, listFilters);
  const { isError, isLoading } = kitchenQuery;
  const isViewingToday = isKitchenDefaultDate(listFilters.date, timezone);
  const { connectionState } = useKitchenRealtime({
    restaurantId,
    filters: listFilters,
    enabled: restaurantId.length > 0 && !isError && isViewingToday,
  });
  const updateKitchenOrderMutation = useUpdateKitchenOrderMutation(
    restaurantId,
    listFilters,
  );
  const cancelOrderMutation = useUpdateOrderStatusMutation(restaurantId);

  const [filters, setFilters] = useState<KitchenFiltersState>(defaultFilters);
  const [view, setView] = useState<KitchenViewMode>("cards");
  const [selectedOrder, setSelectedOrder] = useState<KitchenOrder | null>(null);
  const [orderToCancel, setOrderToCancel] = useState<KitchenOrder | null>(null);
  const [isMoving, startMoving] = useTransition();

  const ordersForDate = useMemo(
    () =>
      filterKitchenOrdersByDate(
        kitchenQuery.data?.orders ?? [],
        listFilters.date,
      ),
    [kitchenQuery.data?.orders, listFilters.date],
  );

  const insights = useMemo(
    () => computeKitchenInsights(ordersForDate, insightLabels),
    [insightLabels, ordersForDate],
  );

  const filteredOrders = useMemo(() => {
    return sortKitchenOrders(applyKitchenFilters(ordersForDate, filters));
  }, [filters, ordersForDate]);

  const kpiValues = useMemo(() => {
    const orders = ordersForDate;
    const values = computeKitchenKpis(orders);
    const trends = computeKitchenKpiTrends(orders, {
      notAvailable: labels.kpis.notAvailable,
      preparingCount: labels.kpis.preparingCount,
      delayedAttention: labels.kpis.delayedAttention,
    });

    return { ...values, trends };
  }, [labels.kpis, ordersForDate]);

  const persistOrderUpdate = useCallback(
    (
      orderId: string,
      input: Omit<
        Parameters<typeof updateKitchenOrderMutation.mutate>[0],
        "orderId"
      >,
    ) => {
      updateKitchenOrderMutation.mutate({ orderId, ...input });
    },
    [updateKitchenOrderMutation],
  );

  const [isManualRefreshing, startManualRefresh] = useTransition();

  const handleRefresh = () => {
    startManualRefresh(() => {
      void kitchenQuery.refetch();
    });
  };

  const handleMoveOrder = (orderId: string, status: KitchenKanbanStatus) => {
    startMoving(() => {
      persistOrderUpdate(orderId, { status });
    });
  };

  const handleStart = (order: KitchenOrder) => {
    persistOrderUpdate(order.id, { status: "in_preparation" });
  };

  const handlePause = (order: KitchenOrder) => {
    persistOrderUpdate(order.id, {
      status: order.isPaused ? "in_preparation" : "waiting",
    });
  };

  const handleMarkReady = (orderId: string) => {
    persistOrderUpdate(orderId, { status: "ready" });
  };

  const handleMarkDelivered = (orderId: string) => {
    persistOrderUpdate(orderId, { status: "delivered" });
  };

  const handleMarkDelayed = (orderId: string) => {
    persistOrderUpdate(orderId, { status: "delayed", priority: "delayed" });
  };

  const handleStationChange = (orderId: string, station: KitchenStation) => {
    persistOrderUpdate(orderId, { station });
  };

  const handleRequestCancelOrder = (order: KitchenOrder) => {
    setOrderToCancel(order);
  };

  const handleConfirmCancelOrder = async () => {
    if (!orderToCancel) {
      return;
    }

    try {
      await cancelOrderMutation.mutateAsync({
        orderId: orderToCancel.id,
        status: "cancelled",
      });
      toast.success(labels.feedback.cancelSuccess);
      if (selectedOrder?.id === orderToCancel.id) {
        setSelectedOrder(null);
      }
      setOrderToCancel(null);
    } catch {
      toast.error(labels.feedback.cancelError);
    }
  };

  const navigateDate = useCallback(
    (nextDate: string) => {
      router.push(
        buildListUrl("/dashboard/kitchen", {
          date: nextDate,
        }),
      );
    },
    [router],
  );

  const clearFilters = () => {
    setFilters(defaultFilters);
    navigateDate(createDefaultKitchenDate(timezone));
  };

  const renderMainContent = () => {
    if (isLoading) {
      return (
        <div
          className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4"
          aria-busy="true"
        >
          {Array.from({ length: 8 }).map((_, index) => (
            <Skeleton key={index} className="h-44 rounded-3xl" />
          ))}
        </div>
      );
    }

    if (kitchenQuery.isError) {
      return <QueryErrorState onRetry={handleRefresh} />;
    }

    if (filteredOrders.length === 0) {
      return (
        <KitchenEmptyState
          labels={labels.empty}
          onNewOrder={
            newOrder.canCreate ? () => setIsNewOrderOpen(true) : undefined
          }
        />
      );
    }

    if (view === "kanban") {
      return (
        <KitchenKanban
          labels={labels}
          orders={filteredOrders}
          onSelectOrder={setSelectedOrder}
          onMoveOrder={handleMoveOrder}
          isMoving={isMoving || updateKitchenOrderMutation.isPending}
        />
      );
    }

    if (view === "timeline") {
      return (
        <KitchenTimeline
          labels={labels}
          orders={filteredOrders}
          onSelectOrder={setSelectedOrder}
        />
      );
    }

    return (
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {filteredOrders.map((order) => (
          <KitchenTicketCard
            key={order.id}
            order={order}
            labels={labels}
            onSelect={setSelectedOrder}
            onStart={handleStart}
            onPause={handlePause}
            onMarkReady={(current) => handleMarkReady(current.id)}
            onMarkDelivered={(current) => handleMarkDelivered(current.id)}
          />
        ))}
      </div>
    );
  };

  return (
    <main className="flex min-h-0 flex-1 flex-col gap-4 p-4 md:gap-5 md:p-6">
      <KitchenHeader
        labels={labels}
        onRefresh={handleRefresh}
        isRefreshing={isManualRefreshing}
        connectionState={connectionState}
        onNewOrder={
          newOrder.canCreate ? () => setIsNewOrderOpen(true) : undefined
        }
        copilot={
          <KitchenCopilotDialog
            labels={labels.copilot}
            actionLabel={labels.actions.viewSuggestions}
            items={insights}
          />
        }
      />

      <KitchenKpis labels={labels.kpis} values={kpiValues} />

      <div className="flex min-h-0 flex-1 flex-col gap-4">
        <KitchenToolbar
          labels={labels}
          filters={filters}
          date={listFilters.date}
          onDateChange={navigateDate}
          view={view}
          onFiltersChange={setFilters}
          onViewChange={setView}
          onClearFilters={clearFilters}
        />

        <div className="min-h-0 flex-1">{renderMainContent()}</div>
      </div>

      <KitchenDetailDialog
        labels={labels}
        order={selectedOrder}
        open={selectedOrder !== null}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedOrder(null);
          }
        }}
        onStatusChange={handleMoveOrder}
        onStationChange={handleStationChange}
        onMarkDelayed={handleMarkDelayed}
        onMarkReady={handleMarkReady}
        onMarkDelivered={handleMarkDelivered}
        onCancelOrder={handleRequestCancelOrder}
      />

      <CancelKitchenOrderDialog
        open={orderToCancel !== null}
        onOpenChange={(open) => {
          if (!open) {
            setOrderToCancel(null);
          }
        }}
        labels={labels.cancelDialog}
        orderNumber={orderToCancel?.number ?? null}
        isPending={cancelOrderMutation.isPending}
        onConfirm={() => {
          void handleConfirmCancelOrder();
        }}
      />

      <KitchenNewOrderDialog
        open={isNewOrderOpen}
        onOpenChange={setIsNewOrderOpen}
        onCreated={() => {
          void kitchenQuery.refetch();
        }}
        labels={newOrder.labels}
        restaurantId={newOrder.restaurantId}
        currency={newOrder.currency}
        canCreate={newOrder.canCreate}
        menuItems={newOrder.menuItems}
        customers={newOrder.customers}
        floorPlanSurfaces={newOrder.floorPlanSurfaces}
        occupiedTableNumbers={newOrder.occupiedTableNumbers}
        localeOptions={newOrder.localeOptions}
      />
    </main>
  );
}
