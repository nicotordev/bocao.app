"use client";

import {
  Archive,
  Edit3,
  Megaphone,
  MessageCircle,
  StickyNote,
} from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import type { CustomerDetail } from "@/lib/customers/types";
import { CustomerChannelBadge } from "./customer-channel-badge";
import { CustomerSegmentBadge } from "./customer-segment-badge";
import type { CustomerSegmentLabelMap, CustomersLabels } from "./types";

type CustomerDrawerProps = {
  labels: CustomersLabels;
  segmentLabels: CustomerSegmentLabelMap;
  customer: CustomerDetail | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}

export function CustomerDrawer({
  labels,
  segmentLabels,
  customer,
  open,
  onOpenChange,
}: CustomerDrawerProps) {
  const isMobile = useIsMobile();

  const showComingSoon = () => {
    toast.message(labels.actions.comingSoon);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={isMobile ? "bottom" : "right"}
        className="w-full overflow-y-auto sm:max-w-xl"
      >
        {customer ? (
          <>
            <SheetHeader className="pr-14">
              <div className="flex items-center gap-3">
                <Avatar size="lg">
                  {customer.avatar ? (
                    <AvatarImage src={customer.avatar} alt={customer.name} />
                  ) : null}
                  <AvatarFallback>{customer.initials}</AvatarFallback>
                </Avatar>
                <div>
                  <SheetTitle>{customer.name}</SheetTitle>
                  <SheetDescription>{labels.drawer.description}</SheetDescription>
                </div>
              </div>
            </SheetHeader>

            <div className="space-y-6 px-6 pb-8">
              <section className="rounded-3xl border border-border bg-card p-4">
                <h3 className="font-heading font-medium">{labels.drawer.profile}</h3>
                <div className="mt-4 space-y-3">
                  <DetailRow label={labels.drawer.phone} value={customer.phone ?? "—"} />
                  <DetailRow label={labels.drawer.email} value={customer.email ?? "—"} />
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-muted-foreground">
                      {labels.drawer.channel}
                    </span>
                    <CustomerChannelBadge
                      channel={customer.primaryChannel}
                      labels={labels.channels}
                    />
                  </div>
                  <DetailRow
                    label={labels.drawer.createdAt}
                    value={customer.createdAtRelative}
                  />
                  <DetailRow
                    label={labels.drawer.lastVisit}
                    value={customer.lastVisitRelative}
                  />
                  <CustomerSegmentBadge
                    segment={customer.segment}
                    labels={segmentLabels}
                  />
                </div>
              </section>

              <section className="rounded-3xl border border-border bg-card p-4">
                <h3 className="font-heading font-medium">{labels.drawer.metrics}</h3>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-muted/30 p-3">
                    <p className="text-xs text-muted-foreground">
                      {labels.drawer.orders}
                    </p>
                    <p className="mt-1 text-lg font-semibold">{customer.orderCount}</p>
                  </div>
                  <div className="rounded-2xl bg-muted/30 p-3">
                    <p className="text-xs text-muted-foreground">
                      {labels.drawer.reservations}
                    </p>
                    <p className="mt-1 text-lg font-semibold">
                      {customer.reservationCount}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-muted/30 p-3">
                    <p className="text-xs text-muted-foreground">
                      {labels.drawer.totalSpend}
                    </p>
                    <p className="mt-1 text-lg font-semibold">{customer.totalSpend}</p>
                  </div>
                  <div className="rounded-2xl bg-muted/30 p-3">
                    <p className="text-xs text-muted-foreground">
                      {labels.drawer.averageTicket}
                    </p>
                    <p className="mt-1 text-lg font-semibold">
                      {customer.averageTicket}
                    </p>
                  </div>
                </div>
                <p className="mt-4 text-sm text-muted-foreground">
                  {labels.drawer.frequency}:{" "}
                  <span className="font-medium text-foreground">
                    {
                      labels.drawer.frequencyLevels[
                        customer.frequencyLabel as keyof CustomersLabels["drawer"]["frequencyLevels"]
                      ]
                    }
                  </span>
                </p>
              </section>

              <section className="rounded-3xl border border-border bg-card p-4">
                <h3 className="font-heading font-medium">
                  {labels.drawer.preferences}
                </h3>
                <div className="mt-4 space-y-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">
                      {labels.drawer.favoriteDishes}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {customer.favoriteDishes.length > 0 ? (
                        customer.favoriteDishes.map((dish) => (
                          <Badge key={dish} variant="secondary">
                            {dish}
                          </Badge>
                        ))
                      ) : (
                        <span>{labels.drawer.noFavoriteDishes}</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-muted-foreground">{labels.drawer.notes}</p>
                    <p className="mt-2">{customer.notes ?? labels.drawer.noNotes}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">{labels.drawer.allergies}</p>
                    <p className="mt-2">
                      {customer.allergies ?? labels.drawer.noAllergies}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">{labels.drawer.tags}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {customer.tags.length > 0 ? (
                        customer.tags.map((tag) => (
                          <Badge key={tag} variant="outline">
                            {tag}
                          </Badge>
                        ))
                      ) : (
                        <span>{labels.drawer.noTags}</span>
                      )}
                    </div>
                  </div>
                </div>
              </section>

              <section className="rounded-3xl border border-border bg-card p-4">
                <h3 className="mb-4 font-heading font-medium">
                  {labels.drawer.history}
                </h3>
                <Tabs defaultValue="orders">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="orders">{labels.drawer.tabs.orders}</TabsTrigger>
                    <TabsTrigger value="reservations">
                      {labels.drawer.tabs.reservations}
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="orders" className="mt-4 space-y-3">
                    {customer.orders.length > 0 ? (
                      customer.orders.map((order) => (
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
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        {labels.empty.description}
                      </p>
                    )}
                  </TabsContent>
                  <TabsContent value="reservations" className="mt-4 space-y-3">
                    {customer.reservations.length > 0 ? (
                      customer.reservations.map((reservation) => (
                        <div
                          key={reservation.id}
                          className="rounded-2xl border border-border/60 bg-muted/20 p-3"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <p className="font-medium">
                              {reservation.guestCount} {labels.drawer.reservations.toLowerCase()}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {reservation.status}
                            </p>
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {reservation.scheduledAtRelative}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        {labels.empty.description}
                      </p>
                    )}
                  </TabsContent>
                </Tabs>
              </section>

              <Separator />

              <div className="grid gap-2">
                <Button className="gap-2" onClick={showComingSoon}>
                  <Edit3 className="size-4" aria-hidden />
                  {labels.actions.editProfile}
                </Button>
                <Button variant="secondary" className="gap-2" onClick={showComingSoon}>
                  <Megaphone className="size-4" aria-hidden />
                  {labels.actions.createCampaign}
                </Button>
                <Button variant="outline" className="gap-2" onClick={showComingSoon}>
                  <MessageCircle className="size-4" aria-hidden />
                  {labels.actions.sendWhatsapp}
                </Button>
                <Button variant="outline" className="gap-2" onClick={showComingSoon}>
                  <StickyNote className="size-4" aria-hidden />
                  {labels.actions.addNote}
                </Button>
                <Button
                  variant="ghost"
                  className="gap-2 text-destructive"
                  onClick={showComingSoon}
                >
                  <Archive className="size-4" aria-hidden />
                  {labels.actions.archive}
                </Button>
              </div>
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
