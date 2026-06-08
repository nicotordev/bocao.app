"use client";

import { GripVertical } from "lucide-react";
import { OrderChannelBadge } from "./order-channel-badge";
import { OrderStatusBadge } from "./order-status-badge";
import type { DashboardOrder, OrderStatus, OrdersLabels } from "./types";

type OrdersKanbanProps = {
  labels: OrdersLabels;
  orders: DashboardOrder[];
  onSelectOrder: (order: DashboardOrder) => void;
  onMoveOrder: (orderId: string, status: OrderStatus) => void;
};

const columns: OrderStatus[] = [
  "received",
  "confirmed",
  "preparing",
  "ready",
  "delivered",
];

export function OrdersKanban({
  labels,
  orders,
  onSelectOrder,
  onMoveOrder,
}: OrdersKanbanProps) {
  return (
    <div
      className="grid gap-3 overflow-x-auto pb-2 xl:grid-cols-5"
      aria-label={labels.tabs.kanban}
    >
      {columns.map((status) => {
        const columnOrders = orders.filter((order) => order.status === status);

        return (
          <section
            key={status}
            className="min-w-72 rounded-3xl border border-border/70 bg-card/70 p-3"
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              const orderId = event.dataTransfer.getData("text/order-id");
              if (orderId) onMoveOrder(orderId, status);
            }}
          >
            <div className="mb-3 flex items-center justify-between gap-2">
              <OrderStatusBadge status={status} labels={labels.statuses} />
              <span className="text-xs text-muted-foreground">{columnOrders.length}</span>
            </div>

            <div className="space-y-2">
              {columnOrders.map((order) => (
                <button
                  key={order.id}
                  type="button"
                  draggable
                  onDragStart={(event) => {
                    event.dataTransfer.setData("text/order-id", order.id);
                  }}
                  onClick={() => onSelectOrder(order)}
                  className="w-full rounded-2xl border border-border bg-background/70 p-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label={`${labels.accessibility.openDetails} ${order.id}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{order.id}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {order.customerName}
                      </p>
                    </div>
                    <GripVertical className="size-4 text-muted-foreground" aria-hidden />
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-2">
                    <OrderChannelBadge
                      channel={order.channel}
                      labels={labels.channels}
                      whatsappLabel={labels.accessibility.whatsappOrder}
                    />
                    <span className="text-sm font-semibold">{order.total}</span>
                  </div>
                  <p className="mt-3 text-xs text-muted-foreground">
                    {order.waitMinutes} {labels.table.minutes}
                  </p>
                </button>
              ))}
              {columnOrders.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
                  {labels.kanban.dropHere}
                </div>
              ) : null}
            </div>
          </section>
        );
      })}
    </div>
  );
}
