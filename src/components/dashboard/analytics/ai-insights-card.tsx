"use client";

import { TbChevronRight, TbSparkles } from "react-icons/tb";
import type { AnalyticsInsight } from "@/lib/analytics/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

const PREVIEW_INSIGHT_COUNT = 2;

type AnalyticsAiInsightsCardProps = {
  title: string;
  description: string;
  viewMoreLabel: string;
  dialogDescription: string;
  insights: AnalyticsInsight[];
  emptyTitle: string;
  emptyDescription: string;
};

function InsightsList({ insights }: { insights: AnalyticsInsight[] }) {
  return (
    <ul className="space-y-3">
      {insights.map((insight) => (
        <li
          key={insight.id}
          className="rounded-2xl border border-border/60 bg-background/40 p-4 text-sm text-muted-foreground"
        >
          {insight.message}
        </li>
      ))}
    </ul>
  );
}

function InsightsDialogContent({
  title,
  dialogDescription,
  insights,
}: {
  title: string;
  dialogDescription: string;
  insights: AnalyticsInsight[];
}) {
  return (
    <DialogContent className="gap-4 sm:max-w-lg">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <TbSparkles className="size-4 text-primary" aria-hidden />
          {title}
        </DialogTitle>
        <DialogDescription>{dialogDescription}</DialogDescription>
      </DialogHeader>
      <ScrollArea className="max-h-[min(60vh,28rem)] pr-3">
        <InsightsList insights={insights} />
      </ScrollArea>
    </DialogContent>
  );
}

function ViewMoreBlock({ label }: { label: string }) {
  return (
    <DialogTrigger asChild>
      <button
        type="button"
        className="flex w-full cursor-pointer items-center justify-between gap-3 rounded-2xl border border-dashed border-primary/30 bg-primary/5 px-4 py-3 text-left text-sm font-medium text-primary transition hover:border-primary/50 hover:bg-primary/10"
      >
        <span className="flex items-center gap-2">
          <TbSparkles className="size-4 shrink-0" aria-hidden />
          {label}
        </span>
        <TbChevronRight className="size-4 shrink-0 opacity-70" aria-hidden />
      </button>
    </DialogTrigger>
  );
}

export function AnalyticsAiInsightsCard({
  title,
  description,
  viewMoreLabel,
  dialogDescription,
  insights,
  emptyTitle,
  emptyDescription,
}: AnalyticsAiInsightsCardProps) {
  const previewInsights = insights.slice(0, PREVIEW_INSIGHT_COUNT);

  if (insights.length === 0) {
    return (
      <Card className="border-border/60 bg-gradient-to-br from-card via-card to-primary/5">
        <CardHeader>
          <div className="flex min-w-0 items-center gap-2">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <TbSparkles className="size-4" aria-hidden />
            </span>
            <div className="min-w-0">
              <CardTitle>{title}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Empty className="border border-dashed border-border/70 bg-muted/10 py-8">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <TbSparkles aria-hidden />
              </EmptyMedia>
              <EmptyTitle>{emptyTitle}</EmptyTitle>
              <EmptyDescription className="max-w-sm">
                {emptyDescription}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/60 bg-gradient-to-br from-card via-card to-primary/5">
      <Dialog>
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <TbSparkles className="size-4" aria-hidden />
              </span>
              <div className="min-w-0">
                <CardTitle>{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
              </div>
            </div>

            <DialogTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="shrink-0 cursor-pointer text-primary hover:text-primary"
              >
                {viewMoreLabel}
              </Button>
            </DialogTrigger>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          <InsightsList insights={previewInsights} />
          <ViewMoreBlock label={viewMoreLabel} />
        </CardContent>

        <InsightsDialogContent
          title={title}
          dialogDescription={dialogDescription}
          insights={insights}
        />
      </Dialog>
    </Card>
  );
}
