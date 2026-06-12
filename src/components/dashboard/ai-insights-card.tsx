import Link from "next/link";
import { TbArrowRight, TbSparkles } from "react-icons/tb";
import { getTranslations } from "next-intl/server";
import type { DashboardInsight } from "@/lib/dashboard/data";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

type AiInsightsCardProps = {
  insights: DashboardInsight[];
};

const priorityStyles: Record<DashboardInsight["priority"], string> = {
  high: "border-primary/30 bg-primary/10 text-primary",
  medium: "border-accent/30 bg-accent/10 text-accent-foreground",
  low: "text-muted-foreground",
};

function InsightItem({
  insight,
  priorityLabel,
  viewActionLabel,
}: {
  insight: DashboardInsight;
  priorityLabel: string;
  viewActionLabel: string;
}) {
  const content = (
    <>
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-sm font-medium">{insight.title}</p>
        <Badge
          variant="outline"
          className={cn("shrink-0", priorityStyles[insight.priority])}
        >
          {priorityLabel}
        </Badge>
      </div>
      <p className="text-sm text-muted-foreground">{insight.description}</p>
      {insight.href ? (
        <p className="mt-3 flex items-center gap-1 text-xs font-medium text-primary">
          {viewActionLabel}
          <TbArrowRight className="size-3.5" aria-hidden />
        </p>
      ) : null}
    </>
  );

  if (!insight.href) {
    return (
      <li className="rounded-2xl border border-border/60 bg-background/40 p-4">
        {content}
      </li>
    );
  }

  return (
    <li>
      <Link
        href={insight.href}
        className="block rounded-2xl border border-border/60 bg-background/40 p-4 transition-colors hover:border-primary/30 hover:bg-background/70"
      >
        {content}
      </Link>
    </li>
  );
}

export async function AiInsightsCard({ insights }: AiInsightsCardProps) {
  const t = await getTranslations("dashboard.home.insights");

  return (
    <Card className="flex h-full flex-col border-border/60 bg-gradient-to-br from-card via-card to-primary/5">
      <CardHeader>
        <div className="flex items-center gap-2">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <TbSparkles className="size-4" aria-hidden />
          </span>
          <div>
            <CardTitle>{t("title")}</CardTitle>
            <CardDescription>{t("description")}</CardDescription>
          </div>
        </div>
        <CardAction>
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/analytics">
              {t("viewAll")}
              <TbArrowRight className="size-4" aria-hidden />
            </Link>
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="flex-1">
        {insights.length === 0 ? (
          <Empty className="border border-dashed border-border/70 bg-muted/10 py-10">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <TbSparkles aria-hidden />
              </EmptyMedia>
              <EmptyTitle>{t("empty.title")}</EmptyTitle>
              <EmptyDescription className="max-w-sm">
                {t("empty.description")}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <ScrollArea className="h-[280px] pr-3">
            <ul className="space-y-3">
              {insights.map((insight) => (
                <InsightItem
                  key={insight.id}
                  insight={insight}
                  priorityLabel={t(`priority.${insight.priority}`)}
                  viewActionLabel={t("viewAction")}
                />
              ))}
            </ul>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
