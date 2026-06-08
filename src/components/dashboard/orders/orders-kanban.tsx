"use client";

import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useKanbanDragGuide } from "@/hooks/use-kanban-drag-guide";
import { isKanbanDragGuideDismissed } from "@/lib/orders/kanban-guide";
import {
  createKanbanGuidePhantomOrder,
  isKanbanGuidePhantomOrder,
} from "@/lib/orders/kanban-guide-phantom";
import { playUiSound } from "@/lib/ui-sounds";
import { OrdersKanbanCardView } from "./orders-kanban-card";
import { OrdersKanbanColumn } from "./orders-kanban-column";
import type { DashboardOrder, OrderStatus, OrdersLabels } from "./types";

type OrdersKanbanProps = {
  labels: OrdersLabels;
  orders: DashboardOrder[];
  onSelectOrder: (order: DashboardOrder) => void;
  onMoveOrder: (orderId: string, status: OrderStatus) => void;
  isMoving?: boolean;
  showDragGuide?: boolean;
};

const columns: OrderStatus[] = [
  "received",
  "confirmed",
  "preparing",
  "ready",
  "delivered",
];

function resolveTargetStatus(overId: string | number): OrderStatus | null {
  const id = String(overId);

  if (id.startsWith("column:")) {
    return id.replace("column:", "") as OrderStatus;
  }

  return null;
}

export function OrdersKanban({
  labels,
  orders,
  onSelectOrder,
  onMoveOrder,
  isMoving = false,
  showDragGuide = false,
}: OrdersKanbanProps) {
  const [activeOrder, setActiveOrder] = useState<DashboardOrder | null>(null);
  const [phantomOrder, setPhantomOrder] = useState<DashboardOrder | null>(null);

  const shouldOfferGuide = showDragGuide && !isKanbanDragGuideDismissed();

  const removePhantomOrder = useCallback(() => {
    setPhantomOrder(null);
  }, []);

  useEffect(() => {
    if (!shouldOfferGuide || orders.length > 0) {
      setPhantomOrder(null);
      return;
    }

    setPhantomOrder(
      (current) =>
        current ??
        createKanbanGuidePhantomOrder({
          customerName: labels.kanban.guidePhantomCustomer,
          total: labels.kanban.guidePhantomTotal,
          owner: labels.kanban.guidePhantomOwner,
        }),
    );
  }, [
    labels.kanban.guidePhantomCustomer,
    labels.kanban.guidePhantomOwner,
    labels.kanban.guidePhantomTotal,
    orders.length,
    shouldOfferGuide,
  ]);

  const displayOrders = useMemo(() => {
    if (!phantomOrder) {
      return orders;
    }

    return [phantomOrder, ...orders];
  }, [orders, phantomOrder]);

  const guideOrderId = useMemo(() => {
    for (const status of columns) {
      const firstOrder = displayOrders.find((order) => order.status === status);

      if (firstOrder) {
        return firstOrder.id;
      }
    }

    return null;
  }, [displayOrders]);

  const { dismissOverlay, dismissGuide } = useKanbanDragGuide({
    active: shouldOfferGuide && guideOrderId !== null,
    title: labels.kanban.guideTitle,
    description: labels.kanban.guideDescription,
    doneText: labels.kanban.guideDismiss,
    onDismissed: removePhantomOrder,
  });

  const ordersByStatus = useMemo(() => {
    const grouped = Object.fromEntries(
      columns.map((status) => [status, [] as DashboardOrder[]]),
    ) as Record<OrderStatus, DashboardOrder[]>;

    for (const order of displayOrders) {
      if (grouped[order.status]) {
        grouped[order.status].push(order);
      }
    }

    return grouped;
  }, [displayOrders]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function handleSelectOrder(order: DashboardOrder) {
    if (isKanbanGuidePhantomOrder(order.id)) {
      return;
    }

    onSelectOrder(order);
  }

  function handleDragStart(event: DragStartEvent) {
    const order = event.active.data.current?.order as
      | DashboardOrder
      | undefined;

    dismissOverlay();

    if (order && !isKanbanGuidePhantomOrder(order.id)) {
      dismissGuide();
    }

    setActiveOrder(order ?? null);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    const orderId = String(active.id);
    const isPhantomDrag = isKanbanGuidePhantomOrder(orderId);

    setActiveOrder(null);

    if (isPhantomDrag) {
      dismissGuide();
      return;
    }

    if (!over || isMoving) {
      return;
    }

    const targetStatus = resolveTargetStatus(over.id);

    if (!targetStatus || !columns.includes(targetStatus)) {
      return;
    }

    const currentOrder = orders.find((order) => order.id === orderId);

    if (!currentOrder || currentOrder.status === targetStatus) {
      return;
    }

    playUiSound("transitionUp");
    onMoveOrder(orderId, targetStatus);
  }

  function handleDragCancel() {
    setActiveOrder(null);
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">{labels.kanban.dragHelp}</p>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div
          className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5"
          aria-label={labels.tabs.kanban}
        >
          {columns.map((status) => (
            <OrdersKanbanColumn
              key={status}
              status={status}
              orders={ordersByStatus[status]}
              labels={labels}
              onSelectOrder={handleSelectOrder}
              isDisabled={isMoving}
              guideOrderId={guideOrderId}
            />
          ))}
        </div>

        <DragOverlay dropAnimation={{ duration: 200, easing: "ease-out" }}>
          {activeOrder ? (
            <OrdersKanbanCardView
              order={activeOrder}
              labels={labels}
              onSelectOrder={handleSelectOrder}
              isDragOverlay
            />
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
