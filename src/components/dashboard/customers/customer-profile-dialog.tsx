"use client";

import {
  TbCalendar,
  TbCoin,
  TbShoppingCart,
  TbTag,
  TbUsers,
} from "react-icons/tb";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import type { CustomerDetail } from "@/lib/customers/types";
import { CustomerChannelBadge } from "./customer-channel-badge";
import { CustomerSegmentBadge } from "./customer-segment-badge";
import { CustomerTagBadge } from "./customer-tag-badge";
import type { CustomerSegmentLabelMap, CustomersLabels } from "./types";

type CustomerProfileDialogProps = {
  labels: CustomersLabels;
  segmentLabels: CustomerSegmentLabelMap;
  customer: CustomerDetail | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}

function MetricCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border/70 bg-muted/20 p-3">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {icon}
        <span>{label}</span>
      </div>
      <p className="mt-2 text-lg font-semibold">{value}</p>
    </div>
  );
}

function ActivityIcon({
  type,
}: {
  type: CustomerDetail["activity"][number]["type"];
}) {
  if (type === "order") {
    return <TbShoppingCart className="size-4" aria-hidden />;
  }

  if (type === "reservation") {
    return <TbCalendar className="size-4" aria-hidden />;
  }

  if (type === "tag_added") {
    return <TbTag className="size-4" aria-hidden />;
  }

  return <TbUsers className="size-4" aria-hidden />;
}

export function CustomerProfileDialog({
  labels,
  segmentLabels,
  customer,
  open,
  onOpenChange,
}: CustomerProfileDialogProps) {
  const profileLabels = labels.profile;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="grid max-h-[min(92vh,860px)] grid-rows-[auto_minmax(0,1fr)] gap-0 overflow-hidden p-0 sm:max-w-3xl">
        {customer ? (
          <DialogHeader className="shrink-0 border-b border-border px-6 py-5">
            <div className="flex items-center gap-4">
              <Avatar size="lg">
                {customer.avatar ? (
                  <AvatarImage src={customer.avatar} alt={customer.name} />
                ) : null}
                <AvatarFallback>{customer.initials}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 text-left">
                <DialogTitle className="truncate">{customer.name}</DialogTitle>
                <DialogDescription>
                  {profileLabels.description}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        ) : (
          <DialogHeader className="sr-only">
            <DialogTitle>{profileLabels.title}</DialogTitle>
            <DialogDescription>{profileLabels.description}</DialogDescription>
          </DialogHeader>
        )}

        {customer ? (
          <div className="min-h-0 overflow-y-auto">
            <div className="space-y-6 px-6 py-6">
              <section className="rounded-3xl border border-border bg-card p-4">
                <h3 className="font-heading font-medium">
                  {profileLabels.basicInfo}
                </h3>
                <div className="mt-4 space-y-3">
                  <DetailRow label={profileLabels.name} value={customer.name} />
                  <DetailRow
                    label={profileLabels.email}
                    value={customer.email ?? "—"}
                  />
                  <DetailRow
                    label={profileLabels.phone}
                    value={customer.phone ?? "—"}
                  />
                  <DetailRow
                    label={profileLabels.birthday}
                    value={profileLabels.notAvailable}
                  />
                  <DetailRow
                    label={profileLabels.customerSince}
                    value={customer.createdAtRelative}
                  />
                  <DetailRow
                    label={profileLabels.lastVisit}
                    value={customer.lastVisitRelative}
                  />
                  <DetailRow
                    label={profileLabels.preferredLanguage}
                    value={profileLabels.notAvailable}
                  />
                  <div className="pt-1">
                    <p className="text-sm text-muted-foreground">
                      {profileLabels.notes}
                    </p>
                    <p className="mt-2 text-sm">
                      {customer.notes ?? profileLabels.noNotes}
                    </p>
                  </div>
                </div>
              </section>

              <section className="rounded-3xl border border-border bg-card p-4">
                <h3 className="font-heading font-medium">
                  {profileLabels.metrics}
                </h3>
                <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  <MetricCard
                    label={profileLabels.totalOrders}
                    value={String(customer.orderCount)}
                    icon={<TbShoppingCart className="size-4" aria-hidden />}
                  />
                  <MetricCard
                    label={profileLabels.totalSpend}
                    value={customer.totalSpend}
                    icon={<TbCoin className="size-4" aria-hidden />}
                  />
                  <MetricCard
                    label={profileLabels.averageOrderValue}
                    value={customer.averageTicket}
                    icon={<TbCoin className="size-4" aria-hidden />}
                  />
                  <MetricCard
                    label={profileLabels.lifetimeValue}
                    value={customer.lifetimeValue}
                    icon={<TbCoin className="size-4" aria-hidden />}
                  />
                  <MetricCard
                    label={profileLabels.lastOrderDate}
                    value={customer.lastOrderAtRelative}
                    icon={<TbCalendar className="size-4" aria-hidden />}
                  />
                  <MetricCard
                    label={profileLabels.reservations}
                    value={String(customer.reservationCount)}
                    icon={<TbUsers className="size-4" aria-hidden />}
                  />
                  <MetricCard
                    label={profileLabels.loyaltyPoints}
                    value={
                      customer.loyaltyPoints !== null
                        ? String(customer.loyaltyPoints)
                        : profileLabels.notAvailable
                    }
                    icon={<TbTag className="size-4" aria-hidden />}
                  />
                </div>
              </section>

              <section className="rounded-3xl border border-border bg-card p-4">
                <h3 className="font-heading font-medium">
                  {profileLabels.segments}
                </h3>
                <div className="mt-4 flex flex-wrap gap-2">
                  {customer.segments.map((segment) => (
                    <CustomerSegmentBadge
                      key={segment}
                      segment={segment}
                      labels={segmentLabels}
                    />
                  ))}
                  {customer.savedSegmentNames.map((segmentName) => (
                    <Badge key={segmentName} variant="secondary">
                      {segmentName}
                    </Badge>
                  ))}
                  {customer.segments.length === 0 &&
                  customer.savedSegmentNames.length === 0 ? (
                    <span className="text-sm text-muted-foreground">
                      {profileLabels.noSegments}
                    </span>
                  ) : null}
                </div>
              </section>

              <section className="rounded-3xl border border-border bg-card p-4">
                <h3 className="font-heading font-medium">
                  {profileLabels.tags}
                </h3>
                <div className="mt-4 flex flex-wrap gap-2">
                  {customer.tags.length > 0 ? (
                    customer.tags.map((tag) => (
                      <CustomerTagBadge key={tag.id} tag={tag} />
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      {profileLabels.noTags}
                    </span>
                  )}
                </div>
              </section>

              <section className="rounded-3xl border border-border bg-card p-4">
                <h3 className="font-heading font-medium">
                  {profileLabels.activityTimeline}
                </h3>
                <div className="mt-4 space-y-0">
                  {customer.activity.length > 0 ? (
                    customer.activity.map((event, index) => (
                      <div key={event.id} className="relative flex gap-3 pb-5">
                        {index < customer.activity.length - 1 ? (
                          <span
                            aria-hidden
                            className="absolute top-8 left-3.5 h-[calc(100%-1rem)] w-px bg-border"
                          />
                        ) : null}
                        <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full border border-border bg-muted/40 text-muted-foreground">
                          <ActivityIcon type={event.type} />
                        </div>
                        <div className="min-w-0 flex-1 pt-0.5">
                          <p className="text-sm font-medium">
                            {resolveActivityMessage(labels, event)}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {event.occurredAtRelative}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      {labels.empty.description}
                    </p>
                  )}
                </div>
              </section>

              <Separator />

              <div className="grid gap-4 lg:grid-cols-2">
                <section className="rounded-3xl border border-border bg-card p-4">
                  <h3 className="font-heading font-medium">
                    {profileLabels.recentOrders}
                  </h3>
                  <div className="mt-4 space-y-3">
                    {customer.orders.slice(0, 5).map((order) => (
                      <div
                        key={order.id}
                        className="rounded-2xl border border-border/60 bg-muted/20 p-3"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <p className="font-medium">{order.orderNumber}</p>
                          <p className="text-sm font-semibold">{order.total}</p>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {order.createdAtRelative}
                        </p>
                      </div>
                    ))}
                    {customer.orders.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        {labels.empty.description}
                      </p>
                    ) : null}
                  </div>
                </section>

                <section className="rounded-3xl border border-border bg-card p-4">
                  <h3 className="font-heading font-medium">
                    {profileLabels.recentReservations}
                  </h3>
                  <div className="mt-4 space-y-3">
                    {customer.reservations.slice(0, 5).map((reservation) => (
                      <div
                        key={reservation.id}
                        className="rounded-2xl border border-border/60 bg-muted/20 p-3"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <p className="font-medium">
                            {reservation.guestCount} {profileLabels.guests}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {reservation.status}
                          </p>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {reservation.scheduledAtRelative}
                        </p>
                      </div>
                    ))}
                    {customer.reservations.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        {labels.empty.description}
                      </p>
                    ) : null}
                  </div>
                </section>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <span>{profileLabels.primaryChannel}:</span>
                <CustomerChannelBadge
                  channel={customer.primaryChannel}
                  labels={labels.channels}
                />
              </div>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function resolveActivityMessage(
  labels: CustomersLabels,
  event: CustomerDetail["activity"][number],
) {
  const values = event.messageValues ?? {};

  if (event.type === "order" && event.channel) {
    return labels.activity.order
      .replace("{name}", event.customerName)
      .replace("{channel}", labels.channels[event.channel]);
  }

  if (event.type === "reservation") {
    return labels.activity.reservation.replace("{name}", event.customerName);
  }

  if (event.type === "inactive") {
    return labels.activity.inactive
      .replace("{name}", event.customerName)
      .replace("{days}", String(values.days ?? ""));
  }

  if (event.type === "segment_change") {
    return labels.activity.markedVip.replace("{name}", event.customerName);
  }

  if (event.type === "tag_added") {
    return labels.activity.tagAdded
      .replace("{name}", event.customerName)
      .replace("{tag}", String(values.tag ?? ""));
  }

  if (event.type === "note") {
    return labels.activity.noteAdded.replace("{name}", event.customerName);
  }

  return event.customerName;
}
