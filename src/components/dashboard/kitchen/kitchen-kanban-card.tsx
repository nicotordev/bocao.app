"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import type { DraggableAttributes } from "@dnd-kit/core";
import type { SyntheticListenerMap } from "@dnd-kit/core/dist/hooks/utilities";
import { AlertTriangle } from "lucide-react";
import { TbGripVertical } from "react-icons/tb";
import {
  isKitchenOrderActiveDelayed,
  isKitchenOrderCompletedLate,
} from "@/lib/kitchen/filters";
import { getKitchenOrderCardClassName } from "@/lib/kitchen/card-styles";
import { cn } from "@/lib/utils";
import type { KitchenLabels, KitchenOrder } from "./types";

type KitchenKanbanCardViewProps = {
  order: KitchenOrder;
  labels: KitchenLabels;
  onSelectOrder: (order: KitchenOrder) => void;
  isDragOverlay?: boolean;
  isDragging?: boolean;
  isDisabled?: boolean;
  dragHandleProps?: {
    attributes: DraggableAttributes;
    listeners: SyntheticListenerMap | undefined;
  };
};

function resolveDestination(order: KitchenOrder, labels: KitchenLabels) {
  if (order.tableNumber) {
    return `${labels.ticket.table} ${order.tableNumber}`;
  }

  return order.customerName ?? "—";
}

function summarizeItems(order: KitchenOrder, labels: KitchenLabels) {
  const [first, second, ...rest] = order.items;

  if (!first) {
    return labels.ticket.noItems;
  }

  const parts = [`${first.quantity}x ${first.name}`];

  if (second) {
    parts.push(`${second.quantity}x ${second.name}`);
  }

  if (rest.length > 0) {
    parts.push(labels.ticket.moreItems.replace("{count}", String(rest.length)));
  }

  return parts.join(" · ");
}

export function KitchenKanbanCardView({
  order,
  labels,
  onSelectOrder,
  isDragOverlay = false,
  isDragging = false,
  isDisabled = false,
  dragHandleProps,
}: KitchenKanbanCardViewProps) {
  const activeDelayed = isKitchenOrderActiveDelayed(order);
  const completedLate = isKitchenOrderCompletedLate(order);

  return (
    <article
      className={cn(
        "rounded-2xl border bg-background/95 text-left shadow-sm transition-[box-shadow,opacity,transform]",
        getKitchenOrderCardClassName(order),
        isDragOverlay &&
          "rotate-1 scale-[1.02] border-primary/40 shadow-lg ring-2 ring-primary/20",
        isDragging && !isDragOverlay && "opacity-40",
        !isDragOverlay &&
          !isDragging &&
          "hover:-translate-y-0.5 hover:shadow-md",
      )}
    >
      <div className="flex items-start gap-1.5 p-2.5">
        <button
          type="button"
          className={cn(
            "mt-0.5 shrink-0 touch-none rounded-lg p-1 text-muted-foreground transition-colors",
            "hover:bg-muted hover:text-foreground",
            isDisabled && "cursor-not-allowed opacity-50",
          )}
          aria-label={labels.kanban.dragHelp}
          disabled={isDisabled || isDragOverlay || !dragHandleProps}
          {...dragHandleProps?.attributes}
          {...dragHandleProps?.listeners}
          onClick={(event) => event.stopPropagation()}
        >
          <TbGripVertical className="size-4" aria-hidden />
        </button>

        <button
          type="button"
          className="min-w-0 flex-1 rounded-lg text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          onClick={() => onSelectOrder(order)}
          aria-label={`${labels.actions.viewDetail} ${order.number}`}
          disabled={isDragOverlay}
        >
          <div className="flex items-start justify-between gap-2">
            <p className="font-semibold leading-tight tabular-nums">
              {order.number}
            </p>
            {activeDelayed ? (
              <AlertTriangle
                className="size-4 shrink-0 text-destructive"
                aria-hidden
              />
            ) : null}
            {completedLate ? (
              <AlertTriangle
                className="size-4 shrink-0 text-warning"
                aria-hidden
              />
            ) : null}
          </div>

          <p className="mt-0.5 truncate text-sm text-muted-foreground">
            {resolveDestination(order, labels)}
          </p>

          <p className="mt-2 line-clamp-2 text-xs text-foreground/85">
            {summarizeItems(order, labels)}
          </p>

          <p className="mt-2 text-xs font-medium tabular-nums text-muted-foreground">
            {order.elapsedMinutes} {labels.ticket.minutes}
            {order.isPaused ? ` · ${labels.ticket.paused}` : ""}
          </p>
        </button>
      </div>
    </article>
  );
}

type KitchenKanbanCardProps = {
  order: KitchenOrder;
  labels: KitchenLabels;
  onSelectOrder: (order: KitchenOrder) => void;
  isDisabled?: boolean;
};

export function KitchenKanbanCard({
  order,
  labels,
  onSelectOrder,
  isDisabled = false,
}: KitchenKanbanCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: order.id,
      data: { type: "order", order },
      disabled: isDisabled,
    });

  const style = transform
    ? { transform: CSS.Translate.toString(transform) }
    : undefined;

  return (
    <div ref={setNodeRef} style={style}>
      <KitchenKanbanCardView
        order={order}
        labels={labels}
        onSelectOrder={onSelectOrder}
        isDragging={isDragging}
        isDisabled={isDisabled}
        dragHandleProps={{ attributes, listeners }}
      />
    </div>
  );
}
