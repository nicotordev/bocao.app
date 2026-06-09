"use client";

import { useCallback, useMemo, useState, useTransition } from "react";
import { QueryErrorState } from "@/components/query/query-result-state";
import { Skeleton } from "@/components/ui/skeleton";
import { applyKitchenFilters, sortKitchenOrders } from "@/lib/kitchen/filters";
import { computeKitchenKpis } from "@/lib/kitchen/compute-kpis";
import { computeKitchenInsights } from "@/lib/kitchen/compute-insights";
import { computeKitchenKpiTrends } from "@/lib/kitchen/compute-kpi-trends";
import type {
  KitchenFiltersState,
  KitchenKanbanStatus,
  KitchenOrder,
  KitchenStation,
  KitchenViewMode,
} from "@/lib/kitchen/types";
import { useUpdateKitchenOrderMutation } from "@/lib/query/kitchen/kitchen.mutations";
import { useKitchenOrdersQuery } from "@/lib/query/kitchen/kitchen.queries";
import { KitchenCopilotCard } from "./kitchen-copilot-card";
import { KitchenDetailDrawer } from "./kitchen-detail-drawer";
import { KitchenEmptyState } from "./kitchen-empty-state";
import { KitchenHeader } from "./kitchen-header";
import { KitchenKanban } from "./kitchen-kanban";
import { KitchenKpis } from "./kitchen-kpis";
import { KitchenTicketCard } from "./kitchen-ticket-card";
import { KitchenTimeline } from "./kitchen-timeline";
import { KitchenToolbar } from "./kitchen-toolbar";
import type { KitchenLabels } from "./types";

type KitchenPageClientProps = {
  labels: KitchenLabels;
  insightLabels: {
    delayedSla: string;
    averagePrep: string;
    busiestStation: string;
  };
  restaurantId: string;
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
}: KitchenPageClientProps) {
  const kitchenQuery = useKitchenOrdersQuery(restaurantId);
  const updateKitchenOrderMutation =
    useUpdateKitchenOrderMutation(restaurantId);

  const [filters, setFilters] = useState<KitchenFiltersState>(defaultFilters);
  const [view, setView] = useState<KitchenViewMode>("cards");
  const [selectedOrder, setSelectedOrder] = useState<KitchenOrder | null>(null);
  const [isMoving, startMoving] = useTransition();

  const orders = kitchenQuery.data?.orders ?? [];
  const insights = useMemo(
    () => computeKitchenInsights(orders, insightLabels),
    [insightLabels, orders],
  );

  const filteredOrders = useMemo(() => {
    return sortKitchenOrders(applyKitchenFilters(orders, filters));
  }, [filters, orders]);

  const kpiValues = useMemo(() => {
    const values = computeKitchenKpis(orders);
    const trends = computeKitchenKpiTrends(orders, {
      notAvailable: labels.kpis.notAvailable,
      preparingCount: labels.kpis.preparingCount,
      delayedAttention: labels.kpis.delayedAttention,
    });

    return { ...values, trends };
  }, [labels.kpis, orders]);

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

  const handleRefresh = () => {
    void kitchenQuery.refetch();
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

  const handleMarkDelayed = (orderId: string) => {
    persistOrderUpdate(orderId, { status: "delayed", priority: "delayed" });
  };

  const handleStationChange = (orderId: string, station: KitchenStation) => {
    persistOrderUpdate(orderId, { station });
  };

  const clearFilters = () => {
    setFilters(defaultFilters);
  };

  const isLoading = kitchenQuery.isLoading || kitchenQuery.isFetching;

  const renderMainContent = () => {
    if (kitchenQuery.isLoading) {
      return (
        <div
          className="grid gap-3 md:grid-cols-2 xl:grid-cols-3"
          aria-busy="true"
        >
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-72 rounded-3xl" />
          ))}
        </div>
      );
    }

    if (kitchenQuery.isError) {
      return <QueryErrorState onRetry={handleRefresh} />;
    }

    if (filteredOrders.length === 0) {
      return <KitchenEmptyState labels={labels.empty} />;
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
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filteredOrders.map((order) => (
          <KitchenTicketCard
            key={order.id}
            order={order}
            labels={labels}
            onSelect={setSelectedOrder}
            onStart={handleStart}
            onPause={handlePause}
            onMarkReady={(current) => handleMarkReady(current.id)}
          />
        ))}
      </div>
    );
  };

  return (
    <main className="flex flex-col gap-6 p-4 md:p-6">
      <KitchenHeader
        labels={labels}
        onRefresh={handleRefresh}
        isRefreshing={isLoading}
      />

      <KitchenKpis labels={labels.kpis} values={kpiValues} />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-4">
          <KitchenToolbar
            labels={labels}
            filters={filters}
            view={view}
            onFiltersChange={setFilters}
            onViewChange={setView}
            onClearFilters={clearFilters}
          />

          {renderMainContent()}
        </div>

        <aside className="hidden xl:block">
          <KitchenCopilotCard
            labels={labels.copilot}
            actionLabel={labels.actions.viewSuggestions}
            items={insights}
          />
        </aside>
      </div>

      <div className="xl:hidden">
        <KitchenCopilotCard
          labels={labels.copilot}
          actionLabel={labels.actions.viewSuggestions}
          items={insights}
        />
      </div>

      <KitchenDetailDrawer
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
      />
    </main>
  );
}
