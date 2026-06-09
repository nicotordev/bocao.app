"use client";

import { Megaphone, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import type { CustomerSegmentCard } from "@/lib/customers/types";
import type { CustomersLabels } from "./types";

type CustomersSegmentsProps = {
  labels: CustomersLabels;
  segments: CustomerSegmentCard[];
  onViewCustomers: (segmentId: CustomerSegmentCard["id"]) => void;
};

function resolveSegmentCopy(
  labels: CustomersLabels,
  segment: CustomerSegmentCard,
) {
  if (segment.id === "at_risk") {
    return labels.segments.cards.atRisk;
  }

  if (segment.id === "high_value") {
    return labels.segments.cards.highValue;
  }

  if (segment.id === "reservation_frequent") {
    return labels.segments.cards.reservationFrequent;
  }

  return labels.segments.cards[segment.id];
}

export function CustomersSegments({
  labels,
  segments,
  onViewCustomers,
}: CustomersSegmentsProps) {
  const showComingSoon = () => {
    toast.message(labels.actions.comingSoon);
  };

  return (
    <section className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
      {segments.map((segment) => {
        const copy = resolveSegmentCopy(labels, segment);

        return (
          <Card
            key={segment.id}
            className="border-border/70 bg-card/80 transition duration-200 hover:-translate-y-0.5 hover:shadow-lg"
          >
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle>{copy.name}</CardTitle>
                  <CardDescription className="mt-2">
                    {copy.description}
                  </CardDescription>
                </div>
                <div className="rounded-2xl border border-border bg-muted/40 p-2">
                  <Users className="size-4 text-primary" aria-hidden />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground">{labels.table.customer}</p>
                  <p className="mt-1 text-lg font-semibold">
                    {segment.customerCount}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">
                    {labels.table.averageTicket}
                  </p>
                  <p className="mt-1 text-lg font-semibold">
                    {segment.averageTicket}
                  </p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                {labels.drawer.lastVisit}: {segment.lastActivityRelative}
              </p>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() => onViewCustomers(segment.id)}
                >
                  {labels.actions.viewCustomers}
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 gap-2"
                  onClick={showComingSoon}
                >
                  <Megaphone className="size-4" aria-hidden />
                  {labels.actions.createCampaign}
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </section>
  );
}
