"use client";

import {
  TbSparkles,
} from "react-icons/tb";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import type { CustomerInsight } from "@/lib/customers/types";
import type { CustomersLabels } from "./types";

type CustomerInsightsCardProps = {
  labels: CustomersLabels;
  insights: CustomerInsight[];
};

function formatInsightMessage(
  t: ReturnType<typeof useTranslations<"dashboard.customers">>,
  insight: CustomerInsight,
) {
  const key = insight.messageKey.replace(
    "insights.",
    "",
  ) as "frequentDeclining" | "whatsappSpend" | "inactiveVip" | "highValuePromo";

  return t(`insights.${key}`, insight.messageValues ?? {});
}

export function CustomerInsightsCard({
  labels,
  insights,
}: CustomerInsightsCardProps) {
  const t = useTranslations("dashboard.customers");

  return (
    <Card className="border-border/60 bg-gradient-to-br from-card via-card to-primary/5">
      <CardHeader>
        <div className="flex items-center gap-2">
          <span className="flex shrink-0 size-8 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <TbSparkles className="size-4" aria-hidden />
          </span>
          <div>
            <CardTitle>{labels.insights.title}</CardTitle>
            <CardDescription>{labels.insights.subtitle}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <ul className="space-y-3">
          {insights.map((insight) => (
            <li
              key={insight.id}
              className="rounded-2xl border border-border/60 bg-background/40 p-4 text-sm text-muted-foreground"
            >
              {formatInsightMessage(t, insight)}
            </li>
          ))}
        </ul>
        <Button
          className="w-full"
          onClick={() => {
            toast.message(labels.actions.comingSoon);
          }}
        >
          {labels.actions.suggestedCampaign}
        </Button>
      </CardContent>
    </Card>
  );
}
