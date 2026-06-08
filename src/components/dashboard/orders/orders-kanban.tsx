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
import { useMemo, useState } from "react";
import { OrdersKanbanCard, OrdersKanbanCardView } from "./orders-kanban-card";
import { OrdersKanbanColumn, kanbanColumnId } from "./orders-kanban-column";
import type { DashboardOrder, OrderStatus, OrdersLabels } from "./types";

type OrdersKanbanProps = {
  labels: OrdersLabels;
  orders: DashboardOrder[];
  onSelectOrder: (order: DashboardOrder) => void;
  onMoveOrder: (orderId: string, status: OrderStatus) => void;
  isMoving?: boolean;
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
}: OrdersKanbanProps) {
  const [activeOrder, setActiveOrder] = useState<DashboardOrder | null>(null);

  const ordersByStatus = useMemo(() => {
    const grouped = Object.fromEntries(
      columns.map((status) => [status, [] as DashboardOrder[]]),
    ) as Record<OrderStatus, DashboardOrder[]>;

    for (const order of orders) {
      if (grouped[order.status]) {
        grouped[order.status].push(order);
      }
    }

    return grouped;
  }, [orders]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function handleDragStart(event: DragStartEvent) {
    const order = event.active.data.current?.order as
      | DashboardOrder
      | undefined;
    setActiveOrder(order ?? null);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveOrder(null);

    if (!over || isMoving) {
      return;
    }

    const targetStatus = resolveTargetStatus(over.id);

    if (!targetStatus || !columns.includes(targetStatus)) {
      return;
    }

    const orderId = String(active.id);
    const currentOrder = orders.find((order) => order.id === orderId);

    if (!currentOrder || currentOrder.status === targetStatus) {
      return;
    }

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
          className="grid gap-3 overflow-x-auto pb-2 xl:grid-cols-5"
          aria-label={labels.tabs.kanban}
        >
          {columns.map((status) => (
            <OrdersKanbanColumn
              key={status}
              status={status}
              orders={ordersByStatus[status]}
              labels={labels}
              onSelectOrder={onSelectOrder}
              isDisabled={isMoving}
            />
          ))}
        </div>

        <DragOverlay dropAnimation={{ duration: 200, easing: "ease-out" }}>
          {activeOrder ? (
            <OrdersKanbanCardView
              order={activeOrder}
              labels={labels}
              onSelectOrder={onSelectOrder}
              isDragOverlay
            />
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
