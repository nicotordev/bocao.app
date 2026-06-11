"use client";

import { useCallback, useMemo, useRef, useState, useTransition } from "react";
import { TbCopy, TbHistory, TbSparkles, TbWand } from "react-icons/tb";
import { toast } from "sonner";
import {
  generateMarketingCampaignAction,
  saveMarketingCampaignAction,
} from "@/app/dashboard/marketing/ai/actions";
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
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  CAMPAIGN_GOALS,
  MARKETING_AUDIENCES,
  MARKETING_CHANNELS,
  MARKETING_TONES,
  type GenerateMarketingCopyInput,
  type GeneratedMarketingCampaign,
} from "@/lib/marketing/ai/schema";
import type { MarketingCampaignRecord } from "@/lib/marketing/ai/types";
import { cn } from "@/lib/utils";
import type { MarketingAiPageClientProps } from "./types";

const DEFAULT_FORM: GenerateMarketingCopyInput = {
  campaignGoal: "increase_sales",
  channel: "whatsapp",
  tone: "friendly",
  audience: "all_customers",
  productName: undefined,
  promotion: undefined,
  extraInstructions: undefined,
};

type QuickActionPreset = {
  id: string;
  label: string;
  patch: Partial<GenerateMarketingCopyInput>;
};

function formatCampaignDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function buildCopyText(
  campaign: GeneratedMarketingCampaign,
  channel: GenerateMarketingCopyInput["channel"],
) {
  const parts = [
    campaign.title,
    "",
    campaign.mainMessage,
    "",
    campaign.callToAction,
  ];

  if (channel === "instagram" && campaign.hashtags.length > 0) {
    parts.push("", campaign.hashtags.join(" "));
  }

  if (channel === "sms" && campaign.shortVersion) {
    return campaign.shortVersion;
  }

  return parts.join("\n").trim();
}

export function MarketingAiPageClient({
  labels,
  restaurantId,
  restaurantName,
  canEdit,
  initialCampaigns,
}: MarketingAiPageClientProps) {
  const historyRef = useRef<HTMLDivElement>(null);
  const [form, setForm] = useState<GenerateMarketingCopyInput>(DEFAULT_FORM);
  const [result, setResult] = useState<GeneratedMarketingCampaign | null>(null);
  const [campaigns, setCampaigns] =
    useState<MarketingCampaignRecord[]>(initialCampaigns);
  const [isGenerating, startGenerate] = useTransition();
  const [isSaving, startSave] = useTransition();

  const quickActions = useMemo<QuickActionPreset[]>(
    () => [
      {
        id: "reactivation",
        label: labels.quickActions.reactivation,
        patch: {
          campaignGoal: "reactivate_customers",
          audience: "inactive_customers",
          channel: "whatsapp",
          tone: "friendly",
        },
      },
      {
        id: "birthday",
        label: labels.quickActions.birthday,
        patch: {
          campaignGoal: "birthday_campaign",
          audience: "frequent_customers",
          channel: "whatsapp",
          tone: "family",
        },
      },
      {
        id: "slow-hours",
        label: labels.quickActions.slowHours,
        patch: {
          campaignGoal: "fill_slow_hours",
          audience: "all_customers",
          channel: "sms",
          tone: "urgent",
        },
      },
      {
        id: "new-product",
        label: labels.quickActions.newProduct,
        patch: {
          campaignGoal: "promote_dish",
          audience: "frequent_customers",
          channel: "instagram",
          tone: "premium",
        },
      },
      {
        id: "whatsapp-promo",
        label: labels.quickActions.whatsappPromo,
        patch: {
          campaignGoal: "increase_sales",
          audience: "all_customers",
          channel: "whatsapp",
          tone: "playful",
        },
      },
    ],
    [labels.quickActions],
  );

  const isFormValid =
    form.campaignGoal.length > 0 &&
    form.channel.length > 0 &&
    form.tone.length > 0 &&
    form.audience.length > 0;

  const mapError = useCallback(
    (error: string) => {
      switch (error) {
        case "FORBIDDEN":
          return labels.errors.forbidden;
        case "INVALID_INPUT":
          return labels.errors.invalidInput;
        case "OPENAI_NOT_CONFIGURED":
          return labels.errors.openaiNotConfigured;
        case "OPENAI_FAILED":
          return labels.errors.openaiFailed;
        case "INVALID_RESPONSE":
          return labels.errors.invalidResponse;
        case "SAVE_FAILED":
          return labels.errors.saveFailed;
        default:
          return labels.errors.generic;
      }
    },
    [labels.errors],
  );

  const updateForm = useCallback(
    <K extends keyof GenerateMarketingCopyInput>(
      key: K,
      value: GenerateMarketingCopyInput[K],
    ) => {
      setForm((current) => ({ ...current, [key]: value }));
    },
    [],
  );

  const resetForm = useCallback(() => {
    setForm(DEFAULT_FORM);
    setResult(null);
  }, []);

  const scrollToHistory = useCallback(() => {
    historyRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const runGenerate = useCallback(() => {
    if (!restaurantId || !canEdit) {
      return;
    }

    startGenerate(async () => {
      const response = await generateMarketingCampaignAction(
        restaurantId,
        form,
      );

      if (!response.ok) {
        toast.error(mapError(response.error));
        return;
      }

      setResult(response.campaign);
    });
  }, [canEdit, form, mapError, restaurantId]);

  const runSave = useCallback(() => {
    if (!restaurantId || !canEdit || !result) {
      return;
    }

    startSave(async () => {
      const response = await saveMarketingCampaignAction(
        restaurantId,
        form,
        result,
      );

      if (!response.ok) {
        toast.error(mapError(response.error));
        return;
      }

      const record: MarketingCampaignRecord = {
        id: response.id,
        goal: form.campaignGoal,
        channel: form.channel,
        tone: form.tone,
        audience: form.audience,
        productName: form.productName ?? null,
        promotion: form.promotion ?? null,
        status: "saved",
        output: result,
        createdAt: new Date().toISOString(),
      };

      setCampaigns((current) => [record, ...current]);
      toast.success(labels.actions.saveSuccess);
    });
  }, [
    canEdit,
    form,
    labels.actions.saveSuccess,
    mapError,
    restaurantId,
    result,
  ]);

  const copyResult = useCallback(async () => {
    if (!result) {
      return;
    }

    const text = buildCopyText(result, form.channel);

    try {
      await navigator.clipboard.writeText(text);
      toast.success(labels.actions.copySuccess);
    } catch {
      toast.error(labels.errors.generic);
    }
  }, [form.channel, labels.actions.copySuccess, labels.errors.generic, result]);

  const loadHistoryItem = useCallback((campaign: MarketingCampaignRecord) => {
    setForm({
      campaignGoal: campaign.goal as GenerateMarketingCopyInput["campaignGoal"],
      channel: campaign.channel as GenerateMarketingCopyInput["channel"],
      tone: campaign.tone as GenerateMarketingCopyInput["tone"],
      audience: campaign.audience as GenerateMarketingCopyInput["audience"],
      productName: campaign.productName ?? undefined,
      promotion: campaign.promotion ?? undefined,
    });
    setResult(campaign.output);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

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

        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={resetForm}>
            {labels.actions.newCampaign}
          </Button>
          <Button type="button" variant="outline" onClick={scrollToHistory}>
            <TbHistory className="size-4" aria-hidden />
            {labels.actions.viewHistory}
          </Button>
        </div>
      </div>

      {!canEdit ? (
        <div className="rounded-3xl border border-border/70 bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
          {labels.permissions.readOnlyHint}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <div className="flex flex-col gap-6">
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle>{labels.quickActions.title}</CardTitle>
              <CardDescription>{labels.form.title}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {quickActions.map((action) => (
                <Button
                  key={action.id}
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={!canEdit}
                  onClick={() => {
                    setForm((current) => ({ ...current, ...action.patch }));
                    setResult(null);
                  }}
                >
                  {action.label}
                </Button>
              ))}
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardHeader>
              <CardTitle>{labels.form.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <FieldGroup>
                <div className="grid gap-4 md:grid-cols-2">
                  <Field>
                    <FieldLabel>{labels.form.campaignGoal}</FieldLabel>
                    <Select
                      value={form.campaignGoal}
                      onValueChange={(value) =>
                        updateForm(
                          "campaignGoal",
                          value as GenerateMarketingCopyInput["campaignGoal"],
                        )
                      }
                      disabled={!canEdit}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CAMPAIGN_GOALS.map((goal) => (
                          <SelectItem key={goal} value={goal}>
                            {labels.goals[goal]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>

                  <Field>
                    <FieldLabel>{labels.form.channel}</FieldLabel>
                    <Select
                      value={form.channel}
                      onValueChange={(value) =>
                        updateForm(
                          "channel",
                          value as GenerateMarketingCopyInput["channel"],
                        )
                      }
                      disabled={!canEdit}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {MARKETING_CHANNELS.map((channel) => (
                          <SelectItem key={channel} value={channel}>
                            {labels.channels[channel]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>

                  <Field>
                    <FieldLabel>{labels.form.tone}</FieldLabel>
                    <Select
                      value={form.tone}
                      onValueChange={(value) =>
                        updateForm(
                          "tone",
                          value as GenerateMarketingCopyInput["tone"],
                        )
                      }
                      disabled={!canEdit}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {MARKETING_TONES.map((tone) => (
                          <SelectItem key={tone} value={tone}>
                            {labels.tones[tone]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>

                  <Field>
                    <FieldLabel>{labels.form.audience}</FieldLabel>
                    <Select
                      value={form.audience}
                      onValueChange={(value) =>
                        updateForm(
                          "audience",
                          value as GenerateMarketingCopyInput["audience"],
                        )
                      }
                      disabled={!canEdit}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {MARKETING_AUDIENCES.map((audience) => (
                          <SelectItem key={audience} value={audience}>
                            {labels.audiences[audience]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                </div>

                <Field>
                  <FieldLabel>{labels.form.productName}</FieldLabel>
                  <Input
                    value={form.productName ?? ""}
                    onChange={(event) =>
                      updateForm(
                        "productName",
                        event.target.value.trim() || undefined,
                      )
                    }
                    placeholder={labels.form.productNamePlaceholder}
                    disabled={!canEdit}
                  />
                </Field>

                <Field>
                  <FieldLabel>{labels.form.promotion}</FieldLabel>
                  <Input
                    value={form.promotion ?? ""}
                    onChange={(event) =>
                      updateForm(
                        "promotion",
                        event.target.value.trim() || undefined,
                      )
                    }
                    placeholder={labels.form.promotionPlaceholder}
                    disabled={!canEdit}
                  />
                </Field>

                <Field>
                  <FieldLabel>{labels.form.extraInstructions}</FieldLabel>
                  <Textarea
                    value={form.extraInstructions ?? ""}
                    onChange={(event) =>
                      updateForm(
                        "extraInstructions",
                        event.target.value.trim() || undefined,
                      )
                    }
                    placeholder={labels.form.extraInstructionsPlaceholder}
                    disabled={!canEdit}
                    maxLength={1000}
                  />
                </Field>

                <Button
                  type="button"
                  className="gap-2"
                  disabled={
                    !canEdit || !isFormValid || isGenerating || !restaurantId
                  }
                  onClick={runGenerate}
                >
                  <TbWand className="size-4" aria-hidden />
                  {isGenerating
                    ? labels.actions.generating
                    : labels.actions.generate}
                </Button>
              </FieldGroup>
            </CardContent>
          </Card>
        </div>

        <Card className="border-border/60 bg-gradient-to-br from-card via-card to-primary/5">
          <CardHeader>
            <CardTitle>{labels.result.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isGenerating ? (
              <div className="space-y-3">
                <Skeleton className="h-6 w-2/3" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-10 w-1/2" />
              </div>
            ) : result ? (
              <>
                <div className="space-y-2">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {labels.result.suggestedTitle}
                  </p>
                  <p className="text-lg font-semibold">{result.title}</p>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {labels.result.mainMessage}
                  </p>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">
                    {result.mainMessage}
                  </p>
                </div>

                {result.alternatives.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      {labels.result.alternatives}
                    </p>
                    <ul className="space-y-2">
                      {result.alternatives.map((alternative) => (
                        <li
                          key={alternative}
                          className="rounded-2xl border border-border/60 bg-background/50 px-3 py-2 text-sm"
                        >
                          {alternative}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                <div className="space-y-2">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {labels.result.callToAction}
                  </p>
                  <p className="text-sm font-medium">{result.callToAction}</p>
                </div>

                {form.channel === "instagram" && result.hashtags.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      {labels.result.hashtags}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {result.hashtags.map((tag) => (
                        <Badge key={tag} variant="secondary">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ) : null}

                {form.channel === "sms" || result.shortVersion ? (
                  <div className="space-y-2">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      {labels.result.shortVersion}
                    </p>
                    <p className="rounded-2xl border border-border/60 bg-background/50 px-3 py-2 text-sm">
                      {result.shortVersion}
                    </p>
                  </div>
                ) : null}

                <div className="space-y-2">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {labels.result.sendingRecommendation}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {result.sendingRecommendation}
                  </p>
                </div>

                <Separator />

                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => void copyResult()}
                  >
                    <TbCopy className="size-4" aria-hidden />
                    {labels.actions.copy}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={!canEdit || isGenerating}
                    onClick={runGenerate}
                  >
                    {labels.actions.regenerate}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    disabled={!canEdit || isSaving}
                    onClick={runSave}
                  >
                    {labels.actions.saveCampaign}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    disabled
                    title={labels.actions.comingSoon}
                  >
                    {labels.actions.useWhatsapp}
                  </Button>
                </div>
              </>
            ) : (
              <Empty className="border border-dashed border-border/70 bg-muted/10 py-10">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <TbSparkles aria-hidden />
                  </EmptyMedia>
                  <EmptyTitle>{labels.result.emptyTitle}</EmptyTitle>
                  <EmptyDescription className="max-w-sm">
                    {labels.result.emptyDescription}
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            )}
          </CardContent>
        </Card>
      </div>

      <div ref={historyRef}>
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle>{labels.history.title}</CardTitle>
          </CardHeader>
          <CardContent>
            {campaigns.length === 0 ? (
              <Empty className="border border-dashed border-border/70 bg-muted/10 py-10">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <TbHistory aria-hidden />
                  </EmptyMedia>
                  <EmptyTitle>{labels.history.emptyTitle}</EmptyTitle>
                  <EmptyDescription className="max-w-sm">
                    {labels.history.emptyDescription}
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
              <ScrollArea className="h-[320px] pr-3">
                <ul className="space-y-3">
                  {campaigns.map((campaign) => (
                    <li key={campaign.id}>
                      <button
                        type="button"
                        onClick={() => loadHistoryItem(campaign)}
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
                        </div>
                        <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                          {campaign.output.mainMessage}
                        </p>
                      </button>
                    </li>
                  ))}
                </ul>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
