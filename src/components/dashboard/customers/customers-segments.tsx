"use client";

import { TbPlus, TbSparkles, TbSpeakerphone, TbUserPlus, TbUsers } from "react-icons/tb";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import type { CustomerOption } from "@/lib/customers/types";
import type { CustomerSavedSegmentSummary } from "@/lib/customers/saved-segments.types";
import type {
  CustomerSmartSegmentCard,
  CustomerSmartSegmentsMeta,
} from "@/lib/customers/smart-segments/types";
import { AddCustomersToSegmentDialog } from "./add-customers-to-segment-dialog";
import { CreateSavedSegmentDialog } from "./create-saved-segment-dialog";
import type { CustomersLabels } from "./types";
import { useState } from "react";

type CustomersSegmentsProps = {
  labels: CustomersLabels;
  smartSegments: CustomerSmartSegmentCard[];
  smartSegmentsMeta: CustomerSmartSegmentsMeta;
  savedSegments: CustomerSavedSegmentSummary[];
  customerOptions: CustomerOption[];
  restaurantId: string;
  onViewSmartSegment: (segmentId: string) => void;
  onViewSavedSegment: (segmentId: string) => void;
  onImportCustomers: () => void;
  onSegmentsChanged: () => void;
};

export function CustomersSegments({
  labels,
  smartSegments,
  smartSegmentsMeta,
  savedSegments,
  customerOptions,
  restaurantId,
  onViewSmartSegment,
  onViewSavedSegment,
  onImportCustomers,
  onSegmentsChanged,
}: CustomersSegmentsProps) {
  const savedLabels = labels.savedSegments;
  const smartLabels = labels.smartSegments;
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [addCustomersDialogOpen, setAddCustomersDialogOpen] = useState(false);
  const [activeSavedSegment, setActiveSavedSegment] =
    useState<CustomerSavedSegmentSummary | null>(null);

  const showComingSoon = () => {
    toast.message(labels.actions.comingSoon);
  };

  function openAddCustomersDialog(segment: CustomerSavedSegmentSummary) {
    setActiveSavedSegment(segment);
    setAddCustomersDialogOpen(true);
  }

  const sourceLabel =
    smartSegmentsMeta.source === "ai"
      ? smartLabels.sourceAi
      : smartLabels.sourceRules;

  return (
    <>
      <section className="space-y-8">
        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold">{savedLabels.title}</h2>
              <p className="text-sm text-muted-foreground">
                {savedLabels.subtitle}
              </p>
            </div>
            <Button
              type="button"
              className="gap-2"
              onClick={() => setCreateDialogOpen(true)}
            >
              <TbPlus className="size-4" aria-hidden />
              {savedLabels.create}
            </Button>
          </div>

          {savedSegments.length === 0 ? (
            <Card className="border-dashed border-border/70 bg-card/50">
              <CardContent className="flex flex-col items-start gap-3 p-6">
                <p className="text-sm text-muted-foreground">
                  {savedLabels.empty}
                </p>
                <Button type="button" onClick={() => setCreateDialogOpen(true)}>
                  {savedLabels.create}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
              {savedSegments.map((segment) => (
                <Card
                  key={segment.id}
                  className="border-border/70 bg-card/80 transition duration-200 hover:-translate-y-0.5 hover:shadow-lg"
                >
                  <CardHeader>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <CardTitle>{segment.name}</CardTitle>
                        <CardDescription className="mt-2">
                          {segment.description || savedLabels.noDescription}
                        </CardDescription>
                      </div>
                      <div className="rounded-2xl border border-border bg-muted/40 p-2">
                        <TbUsers className="size-4 text-primary" aria-hidden />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        {labels.table.customer}
                      </p>
                      <p className="mt-1 text-lg font-semibold">
                        {segment.customerCount}
                      </p>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Button
                        variant="secondary"
                        className="w-full"
                        onClick={() => onViewSavedSegment(segment.id)}
                      >
                        {labels.actions.viewCustomers}
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full gap-2"
                        onClick={() => openAddCustomersDialog(segment)}
                      >
                        <TbUserPlus className="size-4" aria-hidden />
                        {savedLabels.addCustomers}
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full gap-2"
                        onClick={showComingSoon}
                      >
                        <TbSpeakerphone className="size-4" aria-hidden />
                        {labels.actions.createCampaign}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="flex size-8 items-center justify-center rounded-xl bg-primary/15 text-primary">
                  <TbSparkles className="size-4" aria-hidden />
                </span>
                <h2 className="text-lg font-semibold">{smartLabels.title}</h2>
              </div>
              <p className="text-sm text-muted-foreground">
                {smartLabels.subtitle}
              </p>
              {smartSegmentsMeta.generatedAt ? (
                <p className="text-xs text-muted-foreground">
                  {smartLabels.updatedAt.replace(
                    "{date}",
                    new Date(smartSegmentsMeta.generatedAt).toLocaleString(),
                  )}
                </p>
              ) : null}
            </div>
            {smartSegments.length > 0 ? (
              <Badge variant="secondary">{sourceLabel}</Badge>
            ) : null}
          </div>

          {smartSegments.length === 0 ? (
            <Card className="border-dashed border-border/70 bg-card/50">
              <CardContent className="p-6">
                <p className="text-sm text-muted-foreground">
                  {smartLabels.empty}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
              {smartSegments.map((segment) => (
                <Card
                  key={segment.id}
                  className="border-border/70 bg-card/80 transition duration-200 hover:-translate-y-0.5 hover:shadow-lg"
                >
                  <CardHeader>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <CardTitle>{segment.name}</CardTitle>
                        <CardDescription className="mt-2">
                          {segment.description}
                        </CardDescription>
                      </div>
                      <div className="rounded-2xl border border-border bg-muted/40 p-2">
                        <TbSparkles className="size-4 text-primary" aria-hidden />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-muted-foreground">
                          {labels.table.customer}
                        </p>
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
                    {segment.rationale ? (
                      <p className="text-sm text-muted-foreground">
                        {segment.rationale}
                      </p>
                    ) : null}
                    <p className="text-sm text-muted-foreground">
                      {labels.drawer.lastVisit}: {segment.lastActivityRelative}
                    </p>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Button
                        variant="secondary"
                        className="flex-1"
                        onClick={() => onViewSmartSegment(segment.id)}
                      >
                        {labels.actions.viewCustomers}
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1 gap-2"
                        onClick={showComingSoon}
                      >
                        <TbSpeakerphone className="size-4" aria-hidden />
                        {labels.actions.createCampaign}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      <CreateSavedSegmentDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        labels={savedLabels}
        restaurantId={restaurantId}
        onSuccess={(segment) => {
          onSegmentsChanged();
          openAddCustomersDialog(segment);
        }}
      />

      <AddCustomersToSegmentDialog
        open={addCustomersDialogOpen}
        onOpenChange={setAddCustomersDialogOpen}
        labels={savedLabels}
        restaurantId={restaurantId}
        segment={activeSavedSegment}
        customers={customerOptions}
        onImportCustomers={onImportCustomers}
        onSuccess={onSegmentsChanged}
      />
    </>
  );
}
