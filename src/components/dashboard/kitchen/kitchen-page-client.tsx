"use client";

import { useCallback, useMemo, useState, useTransition } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { applyKitchenFilters, sortKitchenOrders } from "@/lib/kitchen/filters";
import { computeKitchenKpis } from "@/lib/kitchen/compute-kpis";
import { KITCHEN_MOCK_INSIGHTS, KITCHEN_MOCK_ORDERS } from "@/lib/kitchen/mock-data";
import type {
  KitchenFiltersState,
  KitchenKanbanStatus,
  KitchenOrder,
  KitchenStation,
  KitchenViewMode,
} from "@/lib/kitchen/types";
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
};

const defaultFilters: KitchenFiltersState = {
  search: "",
  station: "all",
  priority: "all",
  channel: "all",
};

export function KitchenPageClient({ labels }: KitchenPageClientProps) {
  const [orders, setOrders] = useState<KitchenOrder[]>(KITCHEN_MOCK_ORDERS);
  const [filters, setFilters] = useState<KitchenFiltersState>(defaultFilters);
  const [view, setView] = useState<KitchenViewMode>("cards");
  const [selectedOrder, setSelectedOrder] = useState<KitchenOrder | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isMoving, startMoving] = useTransition();

  const filteredOrders = useMemo(() => {
    return sortKitchenOrders(applyKitchenFilters(orders, filters));
  }, [filters, orders]);

  const kpiValues = useMemo(() => computeKitchenKpis(orders), [orders]);

  const updateOrder = useCallback(
    (orderId: string, updater: (order: KitchenOrder) => KitchenOrder) => {
      setOrders((current) =>
        current.map((order) => (order.id === orderId ? updater(order) : order)),
      );
      setSelectedOrder((current) =>
        current?.id === orderId ? updater(current) : current,
      );
    },
    [],
  );

  const handleRefresh = () => {
    setIsLoading(true);

    window.setTimeout(() => {
      setOrders(KITCHEN_MOCK_ORDERS);
      setIsLoading(false);
    }, 600);
  };

  const handleMoveOrder = (orderId: string, status: KitchenKanbanStatus) => {
    startMoving(() => {
      updateOrder(orderId, (order) => ({
        ...order,
        status,
        isPaused: status === "waiting" ? order.isPaused : false,
      }));
    });
  };

  const handleStart = (order: KitchenOrder) => {
    updateOrder(order.id, (current) => ({
      ...current,
      status: "in_preparation",
      isPaused: false,
      assignedTo: current.assignedTo ?? "Equipo cocina",
    }));
  };

  const handlePause = (order: KitchenOrder) => {
    updateOrder(order.id, (current) => ({
      ...current,
      isPaused: !current.isPaused,
      status: current.isPaused ? "in_preparation" : "waiting",
    }));
  };

  const handleMarkReady = (orderId: string) => {
    updateOrder(orderId, (order) => ({
      ...order,
      status: "ready",
      isPaused: false,
    }));
  };

  const handleMarkDelayed = (orderId: string) => {
    updateOrder(orderId, (order) => ({
      ...order,
      status: "delayed",
      priority: "delayed",
    }));
  };

  const handleStationChange = (orderId: string, station: KitchenStation) => {
    updateOrder(orderId, (order) => ({ ...order, station }));
  };

  const clearFilters = () => {
    setFilters(defaultFilters);
  };

  const renderMainContent = () => {
    if (isLoading) {
      return (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3" aria-busy="true">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-72 rounded-3xl" />
          ))}
        </div>
      );
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
          isMoving={isMoving}
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
            items={KITCHEN_MOCK_INSIGHTS}
          />
        </aside>
      </div>

      <div className="xl:hidden">
        <KitchenCopilotCard
          labels={labels.copilot}
          actionLabel={labels.actions.viewSuggestions}
          items={KITCHEN_MOCK_INSIGHTS}
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
