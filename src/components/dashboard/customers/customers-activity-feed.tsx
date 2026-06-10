"use client";

import { TbActivity } from "react-icons/tb";
import { useTranslations } from "next-intl";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { CustomerActivityEvent } from "@/lib/customers/types";
import type { CustomersLabels } from "./types";

type CustomersActivityFeedProps = {
  labels: CustomersLabels;
  events: CustomerActivityEvent[];
  onSelectCustomer?: (customerId: string) => void;
};

function formatActivityMessage(
  t: ReturnType<typeof useTranslations<"dashboard.customers">>,
  labels: CustomersLabels,
  event: CustomerActivityEvent,
) {
  const key = event.messageKey.replace("activity.", "") as
    | "order"
    | "reservation"
    | "inactive"
    | "markedVip"
    | "tagAdded"
    | "noteAdded";

  return t(`activity.${key}`, {
    name: event.customerName,
    days: event.messageValues?.days ?? 0,
    tag: event.messageValues?.tag ?? "",
    channel: event.channel ? labels.channels[event.channel] : "",
  });
}

export function CustomersActivityFeed({
  labels,
  events,
  onSelectCustomer,
}: CustomersActivityFeedProps) {
  const t = useTranslations("dashboard.customers");

  return (
    <Card className="border-border/70 bg-card/80">
      <CardHeader>
        <div className="flex items-center gap-2">
          <TbActivity className="size-4 text-primary" aria-hidden />
          <CardTitle>{labels.activity.title}</CardTitle>
        </div>
        <CardDescription>{labels.activity.subtitle}</CardDescription>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <p className="text-sm text-muted-foreground">{labels.empty.description}</p>
        ) : (
          <ol className="relative space-y-1 before:absolute before:top-4 before:bottom-4 before:left-3 before:w-px before:bg-border">
            {events.map((event) => (
              <li key={event.id} className="relative pl-9">
                <span className="absolute top-3 left-0 grid size-6 place-items-center rounded-full border border-border bg-background">
                  <span className="size-2 rounded-full bg-primary" />
                </span>
                <button
                  type="button"
                  onClick={() => onSelectCustomer?.(event.customerId)}
                  className="w-full rounded-2xl px-3 py-2 text-left transition hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                >
                  <p className="text-sm font-medium">
                    {formatActivityMessage(t, labels, event)}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {event.occurredAtRelative}
                  </p>
                </button>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
