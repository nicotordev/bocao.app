"use client";

import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { useMemo, useState } from "react";
import { TbGripVertical } from "react-icons/tb";
import { resolveKanbanStatus } from "@/lib/kitchen/filters";
import type { KitchenKanbanStatus } from "@/lib/kitchen/types";
import { playUiSound } from "@/lib/ui-sounds";
import { cn } from "@/lib/utils";
import { KitchenStatusBadge } from "./kitchen-status-badge";
import { KitchenTicketCard } from "./kitchen-ticket-card";
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

function resolveTargetStatus(overId: string | number): KitchenKanbanStatus | null {
  const id = String(overId);

  if (id.startsWith("column:")) {
    return id.replace("column:", "") as KitchenKanbanStatus;
  }

  return null;
}

function KitchenKanbanCard({
  order,
  labels,
  onSelectOrder,
  isDisabled,
}: {
  order: KitchenOrder;
  labels: KitchenLabels;
  onSelectOrder: (order: KitchenOrder) => void;
  isDisabled?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: order.id,
      data: { order },
      disabled: isDisabled,
    });

  const style = transform
    ? { transform: CSS.Translate.toString(transform) }
    : undefined;

  return (
    <div ref={setNodeRef} style={style} className={cn(isDragging && "opacity-40")}>
      <div className="flex items-start gap-1">
        <button
          type="button"
          className="mt-3 shrink-0 touch-none rounded-lg p-1 text-muted-foreground hover:bg-muted"
          aria-label={labels.kanban.dragHelp}
          disabled={isDisabled}
          {...attributes}
          {...listeners}
        >
          <TbGripVertical className="size-4" aria-hidden />
        </button>
        <div className="min-w-0 flex-1">
          <KitchenTicketCard
            order={order}
            labels={labels}
            compact
            onSelect={onSelectOrder}
          />
        </div>
      </div>
    </div>
  );
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
        "flex min-h-52 w-72 shrink-0 flex-col rounded-3xl border bg-card/70 p-3 transition-colors sm:w-auto sm:min-w-64 sm:flex-1",
        isOver
          ? "border-primary/50 bg-primary/5 ring-2 ring-primary/20"
          : "border-border/70",
      )}
      aria-label={labels.statuses[status]}
    >
      <header className="mb-3 flex items-center justify-between gap-2">
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

    const targetStatus = resolveTargetStatus(over.id);

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
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">{labels.kanban.dragHelp}</p>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setActiveOrder(null)}
      >
        <div className="flex gap-3 overflow-x-auto pb-2 lg:grid lg:grid-cols-5 lg:overflow-visible">
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
            <div className="w-72 rotate-1 scale-[1.02] opacity-95">
              <KitchenTicketCard
                order={activeOrder}
                labels={labels}
                compact
                onSelect={onSelectOrder}
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
