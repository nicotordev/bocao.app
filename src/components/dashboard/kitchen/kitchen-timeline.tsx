"use client";

import { Activity } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { KitchenLabels, KitchenOrder } from "./types";

type KitchenTimelineProps = {
  labels: KitchenLabels;
  orders: KitchenOrder[];
  onSelectOrder: (order: KitchenOrder) => void;
};

export function KitchenTimeline({
  labels,
  orders,
  onSelectOrder,
}: KitchenTimelineProps) {
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
        <ol className="relative space-y-1 before:absolute before:top-4 before:bottom-4 before:left-3 before:w-px before:bg-border">
          {events.map((event, index) => (
            <li
              key={`${event.order.id}-${event.time}-${index}`}
              className="relative pl-9"
            >
              <span className="absolute top-3 left-0 grid size-6 place-items-center rounded-full border border-border bg-background">
                <span className="size-2 rounded-full bg-primary" />
              </span>
              <button
                type="button"
                onClick={() => onSelectOrder(event.order)}
                className="w-full rounded-2xl px-3 py-2 text-left transition hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              >
                <p className="font-medium">
                  <span className="text-muted-foreground">{event.time}</span>{" "}
                  {labels.timeline[event.titleKey]}{" "}
                  {event.order.number}
                  {event.channel
                    ? ` ${labels.timeline.fromChannel} ${labels.channels[event.channel]}`
                    : ""}
                </p>
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
