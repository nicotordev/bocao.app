"use client";

import { TbSparkles } from "react-icons/tb";
import type { AnalyticsInsight } from "@/lib/analytics/types";
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

type AnalyticsAiInsightsCardProps = {
  title: string;
  description: string;
  insights: AnalyticsInsight[];
  emptyTitle: string;
  emptyDescription: string;
};

export function AnalyticsAiInsightsCard({
  title,
  description,
  insights,
  emptyTitle,
  emptyDescription,
}: AnalyticsAiInsightsCardProps) {
  return (
    <Card className="border-border/60 bg-gradient-to-br from-card via-card to-primary/5">
      <CardHeader>
        <div className="flex items-center gap-2">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <TbSparkles className="size-4" aria-hidden />
          </span>
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {insights.length === 0 ? (
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
        ) : (
          <ScrollArea className="h-[220px] pr-3">
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
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
