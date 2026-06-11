"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { TbHistory, TbPlus, TbSparkles } from "react-icons/tb";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatCampaignDate } from "@/lib/marketing/campaign-utils";
import type { MarketingCampaignRecord } from "@/lib/marketing/ai/types";
import { cn } from "@/lib/utils";
import { MarketingCampaignDetailDialog } from "./marketing-campaign-detail-dialog";
import type { MarketingAiPageClientProps } from "./types";

export function MarketingAiPageClient({
  labels,
  restaurantId,
  restaurantName,
  canEdit,
  campaigns,
}: MarketingAiPageClientProps) {
  const [selectedCampaign, setSelectedCampaign] =
    useState<MarketingCampaignRecord | null>(null);

  const channelCount = useMemo(() => {
    const channels = new Set(campaigns.map((campaign) => campaign.channel));
    return channels.size;
  }, [campaigns]);

  const recentCampaigns = campaigns.slice(0, 5);

  return (
    <main className="flex flex-col gap-6 p-4 md:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-primary">
            <TbSparkles className="size-5" aria-hidden />
          </span>
          <div>
            <h1 className="font-heading text-2xl font-semibold tracking-tight">
              {labels.header.title}
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              {labels.header.subtitle}
            </p>
            {restaurantName ? (
              <p className="mt-2 text-xs text-muted-foreground">
                {restaurantName}
              </p>
            ) : null}
          </div>
        </div>

        {canEdit ? (
          <div className="flex flex-wrap gap-2">
            <Button asChild className="gap-2">
              <Link href="/dashboard/marketing/ai/new">
                <TbPlus className="size-4" aria-hidden />
                {labels.actions.newCampaign}
              </Link>
            </Button>
            <Button asChild variant="outline" className="gap-2">
              <Link href="/dashboard/marketing/ai/new?mode=manual">
                <TbPlus className="size-4" aria-hidden />
                {labels.actions.newManualCampaign}
              </Link>
            </Button>
          </div>
        ) : null}
      </div>

      {!canEdit ? (
        <div className="rounded-3xl border border-border/70 bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
          {labels.permissions.readOnlyHint}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-border/60">
          <CardHeader className="pb-2">
            <CardDescription>{labels.overview.totalCampaigns}</CardDescription>
            <CardTitle className="text-3xl tabular-nums">
              {campaigns.length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-border/60">
          <CardHeader className="pb-2">
            <CardDescription>{labels.overview.recentCampaigns}</CardDescription>
            <CardTitle className="text-3xl tabular-nums">
              {recentCampaigns.length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-border/60">
          <CardHeader className="pb-2">
            <CardDescription>{labels.overview.channelsUsed}</CardDescription>
            <CardTitle className="text-3xl tabular-nums">
              {channelCount}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {canEdit ? (
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle>{labels.quickActions.title}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button asChild variant="secondary" size="sm">
              <Link href="/dashboard/marketing/ai/new?preset=reactivation">
                {labels.quickActions.reactivation}
              </Link>
            </Button>
            <Button asChild variant="secondary" size="sm">
              <Link href="/dashboard/marketing/ai/new?preset=birthday">
                {labels.quickActions.birthday}
              </Link>
            </Button>
            <Button asChild variant="secondary" size="sm">
              <Link href="/dashboard/marketing/ai/new?preset=slow-hours">
                {labels.quickActions.slowHours}
              </Link>
            </Button>
            <Button asChild variant="secondary" size="sm">
              <Link href="/dashboard/marketing/ai/new?preset=new-product">
                {labels.quickActions.newProduct}
              </Link>
            </Button>
            <Button asChild variant="secondary" size="sm">
              <Link href="/dashboard/marketing/ai/new?preset=whatsapp-promo">
                {labels.quickActions.whatsappPromo}
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <Card className="border-border/60">
        <CardHeader>
          <div className="flex items-center gap-2">
            <TbHistory className="size-4 text-muted-foreground" aria-hidden />
            <CardTitle>{labels.history.title}</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {campaigns.length === 0 ? (
            <Empty className="border border-dashed border-border/70 bg-muted/10 py-10">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <TbHistory aria-hidden />
                </EmptyMedia>
                <EmptyTitle>{labels.overview.emptyTitle}</EmptyTitle>
                <EmptyDescription className="max-w-sm">
                  {labels.overview.emptyDescription}
                </EmptyDescription>
              </EmptyHeader>
              {canEdit && restaurantId ? (
                <Button asChild className="mt-4">
                  <Link href="/dashboard/marketing/ai/new">
                    {labels.actions.createFirst}
                  </Link>
                </Button>
              ) : null}
            </Empty>
          ) : (
            <ScrollArea className="h-[420px] pr-3">
              <ul className="space-y-3">
                {campaigns.map((campaign) => (
                  <li key={campaign.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedCampaign(campaign)}
                      className={cn(
                        "w-full rounded-3xl border border-border/60 bg-card px-4 py-4 text-left transition-colors",
                        "hover:border-primary/30 hover:bg-primary/5",
                      )}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-medium">{campaign.output.title}</p>
                        <span className="text-xs text-muted-foreground">
                          {formatCampaignDate(campaign.createdAt)}
                        </span>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <Badge variant="outline">
                          {labels.channels[
                            campaign.channel as keyof typeof labels.channels
                          ] ?? campaign.channel}
                        </Badge>
                        <Badge variant="outline">
                          {labels.goals[
                            campaign.goal as keyof typeof labels.goals
                          ] ?? campaign.goal}
                        </Badge>
                        <Badge
                          variant={
                            campaign.source === "manual"
                              ? "secondary"
                              : "outline"
                          }
                        >
                          {campaign.source === "manual"
                            ? labels.mode.badgeManual
                            : labels.mode.badgeAi}
                        </Badge>
                        {campaign.productName ? (
                          <Badge variant="secondary">
                            {campaign.productName}
                          </Badge>
                        ) : null}
                      </div>
                      <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                        {campaign.output.mainMessage}
                      </p>
                      <p className="mt-3 text-xs font-medium text-primary">
                        {labels.actions.viewCampaign}
                      </p>
                    </button>
                  </li>
                ))}
              </ul>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      <MarketingCampaignDetailDialog
        open={selectedCampaign !== null}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedCampaign(null);
          }
        }}
        labels={labels}
        campaign={selectedCampaign}
      />
    </main>
  );
}
