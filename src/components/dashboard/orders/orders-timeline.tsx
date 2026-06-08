"use client";

import { Activity } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { OrderChannelBadge } from "./order-channel-badge";
import type { DashboardOrder, OrdersLabels } from "./types";

type OrdersTimelineProps = {
  labels: OrdersLabels;
  orders: DashboardOrder[];
  onSelectOrder: (order: DashboardOrder) => void;
};

export function OrdersTimeline({
  labels,
  orders,
  onSelectOrder,
}: OrdersTimelineProps) {
  const events = orders.flatMap((order) =>
    order.timeline.map((event) => ({
      ...event,
      order,
    })),
  );

  return (
    <Card className="border-border/70 bg-card/80">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Activity className="size-4 text-primary" aria-hidden />
          <CardTitle>{labels.timeline.title}</CardTitle>
        </div>
        <CardDescription>{labels.timeline.subtitle}</CardDescription>
      </CardHeader>
      <CardContent>
        <ol className="relative space-y-1 before:absolute before:bottom-4 before:left-3 before:top-4 before:w-px before:bg-border">
          {events.map((event, index) => (
            <li key={`${event.order.id}-${event.time}-${index}`} className="relative pl-9">
              <span className="absolute left-0 top-3 grid size-6 place-items-center rounded-full border border-border bg-background">
                <span className="size-2 rounded-full bg-primary" />
              </span>
              <button
                type="button"
                onClick={() => onSelectOrder(event.order)}
                className="w-full rounded-2xl px-3 py-2 text-left transition hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <p className="font-medium">
                    <span className="text-muted-foreground">{event.time}</span>{" "}
                    {labels.timeline[event.titleKey as keyof OrdersLabels["timeline"]]}{" "}
                    {event.order.id}
                  </p>
                  <OrderChannelBadge
                    channel={event.order.channel}
                    labels={labels.channels}
                    whatsappLabel={labels.accessibility.whatsappOrder}
                  />
                </div>
                {event.actor ? (
                  <p className="mt-1 text-xs text-muted-foreground">{event.actor}</p>
                ) : null}
              </button>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}
