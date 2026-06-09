"use client";

import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { useMemo, useState } from "react";
import { resolveKanbanStatus } from "@/lib/kitchen/filters";
import type { KitchenKanbanStatus } from "@/lib/kitchen/types";
import { playUiSound } from "@/lib/ui-sounds";
import { cn } from "@/lib/utils";
import { KitchenStatusBadge } from "./kitchen-status-badge";
import {
  KitchenKanbanCard,
  KitchenKanbanCardView,
} from "./kitchen-kanban-card";
import type { KitchenLabels, KitchenOrder } from "./types";

type KitchenKanbanProps = {
  labels: KitchenLabels;
  orders: KitchenOrder[];
  onSelectOrder: (order: KitchenOrder) => void;
  onMoveOrder: (orderId: string, status: KitchenKanbanStatus) => void;
  isMoving?: boolean;
};

const columns: KitchenKanbanStatus[] = [
  "received",
  "in_preparation",
  "waiting",
  "ready",
  "delivered",
];

function kanbanColumnId(status: KitchenKanbanStatus) {
  return `column:${status}`;
}

function resolveTargetStatus(
  overId: string | number,
  orders: KitchenOrder[],
): KitchenKanbanStatus | null {
  const id = String(overId);

  if (id.startsWith("column:")) {
    return id.replace("column:", "") as KitchenKanbanStatus;
  }

  const order = orders.find((entry) => entry.id === id);

  if (order) {
    return resolveKanbanStatus(order.status);
  }

  return null;
}

function KitchenKanbanColumn({
  status,
  orders,
  labels,
  onSelectOrder,
  isDisabled,
}: {
  status: KitchenKanbanStatus;
  orders: KitchenOrder[];
  labels: KitchenLabels;
  onSelectOrder: (order: KitchenOrder) => void;
  isDisabled?: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: kanbanColumnId(status),
    data: { type: "column", status },
    disabled: isDisabled,
  });

  return (
    <section
      ref={setNodeRef}
      className={cn(
        "flex min-h-[min(70vh,42rem)] min-w-0 flex-col rounded-3xl border bg-card/70 p-3 transition-colors",
        isOver
          ? "border-primary/50 bg-primary/5 ring-2 ring-primary/20"
          : "border-border/70",
      )}
      aria-label={labels.statuses[status]}
    >
      <header className="mb-3 flex items-center justify-between gap-2 px-0.5">
        <KitchenStatusBadge status={status} labels={labels.statuses} />
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium tabular-nums text-muted-foreground">
          {orders.length}
        </span>
      </header>

      <div className="flex flex-1 flex-col gap-2">
        {orders.map((order) => (
          <KitchenKanbanCard
            key={order.id}
            order={order}
            labels={labels}
            onSelectOrder={onSelectOrder}
            isDisabled={isDisabled}
          />
        ))}

        {orders.length === 0 ? (
          <div
            className={cn(
              "flex flex-1 items-center justify-center rounded-2xl border border-dashed p-6 text-center text-xs text-muted-foreground",
              isOver && "border-primary/40 bg-primary/5 text-primary/80",
            )}
          >
            {labels.kanban.dropHere}
          </div>
        ) : null}
      </div>
    </section>
  );
}

export function KitchenKanban({
  labels,
  orders,
  onSelectOrder,
  onMoveOrder,
  isMoving = false,
}: KitchenKanbanProps) {
  const [activeOrder, setActiveOrder] = useState<KitchenOrder | null>(null);

  const ordersByStatus = useMemo(() => {
    const grouped = Object.fromEntries(
      columns.map((status) => [status, [] as KitchenOrder[]]),
    ) as Record<KitchenKanbanStatus, KitchenOrder[]>;

    for (const order of orders) {
      const status = resolveKanbanStatus(order.status);
      grouped[status].push(order);
    }

    return grouped;
  }, [orders]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function handleDragStart(event: DragStartEvent) {
    const order = event.active.data.current?.order as KitchenOrder | undefined;
    setActiveOrder(order ?? null);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveOrder(null);

    if (!over || isMoving) {
      return;
    }

    const targetStatus = resolveTargetStatus(over.id, orders);

    if (!targetStatus || !columns.includes(targetStatus)) {
      return;
    }

    const currentOrder = orders.find((order) => order.id === String(active.id));

    if (!currentOrder) {
      return;
    }

    const currentKanbanStatus = resolveKanbanStatus(currentOrder.status);

    if (currentKanbanStatus === targetStatus) {
      return;
    }

    playUiSound("transitionUp");
    onMoveOrder(String(active.id), targetStatus);
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveOrder(null)}
    >
      <div
        className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5"
        aria-label={labels.views.kanban}
      >
        {columns.map((status) => (
          <KitchenKanbanColumn
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
          <div className="w-full max-w-xs">
            <KitchenKanbanCardView
              order={activeOrder}
              labels={labels}
              onSelectOrder={onSelectOrder}
              isDragOverlay
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
