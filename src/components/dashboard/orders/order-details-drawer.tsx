"use client";

import {
  TbMessageCircle,
} from "react-icons/tb";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { OrderChannelBadge } from "./order-channel-badge";
import { OrderStatusBadge } from "./order-status-badge";
import type { DashboardOrder, OrdersLabels } from "./types";

type OrderDetailsDrawerProps = {
  labels: OrdersLabels;
  order: DashboardOrder | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function OrderDetailsDrawer({
  labels,
  order,
  open,
  onOpenChange,
}: OrderDetailsDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        {order ? (
          <>
            <SheetHeader className="pr-14">
              <SheetTitle>
                {labels.drawer.title} {order.id}
              </SheetTitle>
              <SheetDescription>{labels.drawer.description}</SheetDescription>
            </SheetHeader>

            <div className="space-y-6 px-6 pb-6">
              <section className="rounded-3xl border border-border bg-card p-4">
                <h3 className="font-heading font-medium">{labels.drawer.general}</h3>
                <div className="mt-4 grid gap-3 text-sm">
                  <DetailRow label={labels.drawer.number} value={order.id} />
                  <DetailRow label={labels.drawer.date} value={order.createdAt} />
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">{labels.table.status}</span>
                    <OrderStatusBadge status={order.status} labels={labels.statuses} />
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">{labels.table.channel}</span>
                    <OrderChannelBadge
                      channel={order.channel}
                      labels={labels.channels}
                      whatsappLabel={labels.accessibility.whatsappOrder}
                    />
                  </div>
                </div>
              </section>

              <section className="rounded-3xl border border-border bg-card p-4">
                <h3 className="font-heading font-medium">{labels.drawer.customer}</h3>
                <div className="mt-4 grid gap-3 text-sm">
                  <DetailRow label={labels.table.customer} value={order.customerName} />
                  <DetailRow label={labels.drawer.phone} value={order.phone} />
                  <DetailRow label={labels.drawer.history} value={order.history} />
                </div>
                {order.channel === "whatsapp" ? (
                  <div className="mt-4 flex items-center gap-2 rounded-2xl border border-primary/20 bg-primary/10 p-3 text-sm text-primary">
                    <TbMessageCircle className="size-4" aria-hidden />
                    {labels.channels.whatsapp}
                  </div>
                ) : null}
              </section>

              <section className="rounded-3xl border border-border bg-card p-4">
                <h3 className="font-heading font-medium">{labels.drawer.products}</h3>
                <div className="mt-4 space-y-3">
                  {order.items.map((item) => (
                    <div
                      key={`${item.name}-${item.price}`}
                      className="flex items-center justify-between gap-3 text-sm"
                    >
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-xs text-muted-foreground">x{item.quantity}</p>
                      </div>
                      <span className="font-medium">{item.price}</span>
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-3xl border border-border bg-card p-4">
                <h3 className="font-heading font-medium">{labels.drawer.summary}</h3>
                <div className="mt-4 grid gap-3 text-sm">
                  <DetailRow label={labels.drawer.subtotal} value={order.summary.subtotal} />
                  <DetailRow label={labels.drawer.taxes} value={order.summary.taxes} />
                  <Separator />
                  <DetailRow label={labels.drawer.total} value={order.summary.total} strong />
                </div>
              </section>

              <section className="rounded-3xl border border-border bg-card p-4">
                <h3 className="font-heading font-medium">{labels.drawer.timeline}</h3>
                <ol className="mt-4 space-y-3">
                  {order.timeline.map((event) => (
                    <li key={`${event.time}-${event.titleKey}`} className="flex gap-3 text-sm">
                      <span className="text-muted-foreground">{event.time}</span>
                      <div>
                        <p className="font-medium">
                          {labels.timeline[
                            event.titleKey as keyof OrdersLabels["timeline"]
                          ]}
                        </p>
                        {event.actor ? (
                          <p className="text-xs text-muted-foreground">{event.actor}</p>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ol>
              </section>

              <section className="rounded-3xl border border-border bg-card p-4">
                <h3 className="font-heading font-medium">{labels.drawer.notes}</h3>
                <p className="mt-3 text-sm text-muted-foreground">{order.notes}</p>
              </section>
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

function DetailRow({
  label,
  value,
  strong,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className={strong ? "font-semibold" : "font-medium"}>{value}</span>
    </div>
  );
}
