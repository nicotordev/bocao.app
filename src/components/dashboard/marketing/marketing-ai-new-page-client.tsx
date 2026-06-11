"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState, useTransition } from "react";
import {
  TbArrowLeft,
  TbChevronLeft,
  TbChevronRight,
  TbCopy,
  TbPencil,
  TbSparkles,
  TbWand,
} from "react-icons/tb";
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
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
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
import { buildCopyText } from "@/lib/marketing/campaign-utils";
import {
  CAMPAIGN_GOALS,
  MARKETING_AUDIENCES,
  MARKETING_CHANNELS,
  MARKETING_TONES,
  manualCampaignDraftSchema,
  manualDraftToCampaignOutput,
  type CampaignSource,
  type GenerateMarketingCopyInput,
  type GeneratedMarketingCampaign,
  type ManualCampaignDraft,
} from "@/lib/marketing/ai/schema";
import type { MenuItemOption } from "@/lib/menu/types";
import { cn } from "@/lib/utils";
import { MarketingCampaignResult } from "./marketing-campaign-result";
import { MarketingManualCampaignFields } from "./marketing-manual-campaign-fields";
import { MarketingMenuProductPickerDialog } from "./marketing-menu-product-picker-dialog";
import type { MarketingAiNewPageClientProps } from "./types";

const DEFAULT_FORM: GenerateMarketingCopyInput = {
  source: "ai",
  campaignGoal: "increase_sales",
  channel: "whatsapp",
  tone: "friendly",
  audience: "all_customers",
  menuItemId: undefined,
  productName: undefined,
  promotion: undefined,
  extraInstructions: undefined,
};

const DEFAULT_MANUAL_DRAFT: ManualCampaignDraft = {
  title: "",
  mainMessage: "",
  callToAction: "",
  shortVersion: "",
  hashtagsText: "",
  sendingRecommendation: "",
};

const WIZARD_STEPS = [
  { id: 1, key: "goal" as const },
  { id: 2, key: "audience" as const },
  { id: 3, key: "details" as const },
  { id: 4, key: "result" as const },
];

const PRESET_PATCHES: Record<string, Partial<GenerateMarketingCopyInput>> = {
  reactivation: {
    campaignGoal: "reactivate_customers",
    audience: "inactive_customers",
    channel: "whatsapp",
    tone: "friendly",
  },
  birthday: {
    campaignGoal: "birthday_campaign",
    audience: "frequent_customers",
    channel: "whatsapp",
    tone: "family",
  },
  "slow-hours": {
    campaignGoal: "fill_slow_hours",
    audience: "all_customers",
    channel: "sms",
    tone: "urgent",
  },
  "new-product": {
    campaignGoal: "promote_dish",
    audience: "frequent_customers",
    channel: "instagram",
    tone: "premium",
  },
  "whatsapp-promo": {
    campaignGoal: "increase_sales",
    audience: "all_customers",
    channel: "whatsapp",
    tone: "playful",
  },
};

function getInitialForm(
  initialPreset?: string,
  initialMode?: CampaignSource,
): GenerateMarketingCopyInput {
  const preset = initialPreset ? PRESET_PATCHES[initialPreset] : undefined;
  return {
    ...DEFAULT_FORM,
    ...preset,
    source: initialMode ?? DEFAULT_FORM.source,
  };
}

export function MarketingAiNewPageClient({
  labels,
  restaurantId,
  restaurantName,
  currency,
  canEdit,
  menuItems,
  initialPreset,
  initialMode,
}: MarketingAiNewPageClientProps) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<GenerateMarketingCopyInput>(() =>
    getInitialForm(initialPreset, initialMode),
  );
  const [creationMode, setCreationMode] = useState<CampaignSource>(
    initialMode ?? "ai",
  );
  const [manualDraft, setManualDraft] =
    useState<ManualCampaignDraft>(DEFAULT_MANUAL_DRAFT);
  const [selectedMenuItem, setSelectedMenuItem] =
    useState<MenuItemOption | null>(null);
  const [productPickerOpen, setProductPickerOpen] = useState(false);
  const [result, setResult] = useState<GeneratedMarketingCampaign | null>(null);
  const [isGenerating, startGenerate] = useTransition();
  const [isSaving, startSave] = useTransition();

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
      setResult(null);
    },
    [],
  );

  const isManualMode = creationMode === "manual";

  const isManualDraftValid = useMemo(
    () => manualCampaignDraftSchema.safeParse(manualDraft).success,
    [manualDraft],
  );

  const canAdvanceStep = useMemo(() => {
    switch (step) {
      case 1:
        return Boolean(form.campaignGoal && form.channel);
      case 2:
        return Boolean(form.tone && form.audience);
      case 3:
        return true;
      case 4:
        return isManualMode ? isManualDraftValid : Boolean(result);
      default:
        return false;
    }
  }, [form, isManualDraftValid, isManualMode, result, step]);

  const setMode = useCallback((mode: CampaignSource) => {
    setCreationMode(mode);
    setForm((current) => ({ ...current, source: mode }));
    setResult(null);
  }, []);

  const handleSelectMenuItem = useCallback((menuItem: MenuItemOption) => {
    setSelectedMenuItem(menuItem);
    setForm((current) => ({
      ...current,
      menuItemId: menuItem.id,
      productName: menuItem.name,
    }));
    setResult(null);
  }, []);

  const handleClearMenuItem = useCallback(() => {
    setSelectedMenuItem(null);
    setForm((current) => ({
      ...current,
      menuItemId: undefined,
      productName: undefined,
    }));
    setResult(null);
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
      setStep(4);
    });
  }, [canEdit, form, mapError, restaurantId]);

  const runSave = useCallback(() => {
    if (!restaurantId || !canEdit) {
      return;
    }

    const output = isManualMode
      ? manualDraftToCampaignOutput(manualDraft)
      : result;

    if (!output) {
      return;
    }

    startSave(async () => {
      const response = await saveMarketingCampaignAction(
        restaurantId,
        { ...form, source: creationMode },
        output,
      );

      if (!response.ok) {
        toast.error(mapError(response.error));
        return;
      }

      toast.success(labels.actions.saveSuccess);
      router.push("/dashboard/marketing/ai");
      router.refresh();
    });
  }, [
    canEdit,
    creationMode,
    form,
    isManualMode,
    labels.actions.saveSuccess,
    manualDraft,
    mapError,
    result,
    restaurantId,
    router,
  ]);

  const copyResult = useCallback(async () => {
    if (!result) {
      return;
    }

    try {
      await navigator.clipboard.writeText(buildCopyText(result, form.channel));
      toast.success(labels.actions.copySuccess);
    } catch {
      toast.error(labels.errors.generic);
    }
  }, [form.channel, labels.actions.copySuccess, labels.errors.generic, result]);

  const goNext = () => {
    if (step === 3) {
      if (isManualMode) {
        setStep(4);
        return;
      }

      runGenerate();
      return;
    }

    setStep((current) => Math.min(current + 1, WIZARD_STEPS.length));
  };

  const goBack = () => {
    setStep((current) => Math.max(current - 1, 1));
  };

  if (!canEdit) {
    return (
      <main className="flex flex-col gap-6 p-4 md:p-6">
        <Button asChild variant="ghost" className="w-fit gap-2 px-0">
          <Link href="/dashboard/marketing/ai">
            <TbArrowLeft className="size-4" aria-hidden />
            {labels.actions.back}
          </Link>
        </Button>
        <div className="rounded-3xl border border-border bg-card p-6">
          <h2 className="font-medium">{labels.permissions.deniedTitle}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {labels.permissions.readOnlyHint}
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex flex-col gap-6 p-4 md:p-6">
      <div className="flex flex-col gap-4">
        <Button asChild variant="ghost" className="w-fit gap-2">
          <Link href="/dashboard/marketing/ai">
            <TbArrowLeft className="size-4" aria-hidden />
            {labels.actions.back}
          </Link>
        </Button>

        <div className="flex items-start gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-primary">
            <TbSparkles className="size-5" aria-hidden />
          </span>
          <div>
            <h1 className="font-heading text-2xl font-semibold tracking-tight">
              {labels.wizard.title}
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              {labels.wizard.subtitle}
            </p>
            {restaurantName ? (
              <p className="mt-2 text-xs text-muted-foreground">
                {restaurantName}
              </p>
            ) : null}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        {WIZARD_STEPS.map((wizardStep) => (
          <div
            key={wizardStep.id}
            className={cn(
              "rounded-2xl border px-3 py-3 text-center text-xs font-medium transition-colors",
              step === wizardStep.id
                ? "border-primary bg-primary text-primary-foreground"
                : step > wizardStep.id
                  ? "border-border bg-muted/40 text-foreground"
                  : "border-border bg-background text-muted-foreground",
            )}
          >
            {labels.wizard.steps[wizardStep.key]}
          </div>
        ))}
      </div>

      <p className="text-center text-xs text-muted-foreground">
        {labels.wizard.stepProgress
          .replace("{current}", String(step))
          .replace("{total}", String(WIZARD_STEPS.length))}
      </p>

      <Card className="border-border/60">
        <CardHeader>
          <CardTitle>
            {step === 1
              ? labels.wizard.steps.goal
              : step === 2
                ? labels.wizard.steps.audience
                : step === 3
                  ? labels.wizard.steps.details
                  : labels.wizard.steps.result}
          </CardTitle>
          {step === 4 ? (
            <CardDescription>
              {isManualMode
                ? labels.wizard.manualHint
                : labels.wizard.generateHint}
            </CardDescription>
          ) : null}
        </CardHeader>
        <CardContent>
          {step === 1 ? (
            <FieldGroup>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium">
                    {labels.wizard.modeTitle}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {labels.wizard.modeDescription}
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => setMode("ai")}
                    className={cn(
                      "rounded-3xl border p-4 text-left transition-colors",
                      creationMode === "ai"
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/30",
                    )}
                  >
                    <div className="flex items-center gap-2 font-medium">
                      <TbSparkles className="size-4" aria-hidden />
                      {labels.mode.ai}
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {labels.mode.aiDescription}
                    </p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode("manual")}
                    className={cn(
                      "rounded-3xl border p-4 text-left transition-colors",
                      creationMode === "manual"
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/30",
                    )}
                  >
                    <div className="flex items-center gap-2 font-medium">
                      <TbPencil className="size-4" aria-hidden />
                      {labels.mode.manual}
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {labels.mode.manualDescription}
                    </p>
                  </button>
                </div>
              </div>

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
              </div>
            </FieldGroup>
          ) : null}

          {step === 2 ? (
            <FieldGroup>
              <div className="grid gap-4 md:grid-cols-2">
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
            </FieldGroup>
          ) : null}

          {step === 3 ? (
            <FieldGroup>
              <Field>
                <FieldLabel>{labels.form.productName}</FieldLabel>
                <div className="flex flex-col gap-3 rounded-3xl border border-border/60 bg-muted/10 p-4">
                  {selectedMenuItem ? (
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-medium">{selectedMenuItem.name}</p>
                        {selectedMenuItem.description ? (
                          <p className="mt-1 text-sm text-muted-foreground">
                            {selectedMenuItem.description}
                          </p>
                        ) : null}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setProductPickerOpen(true)}
                        >
                          {labels.form.changeProduct}
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={handleClearMenuItem}
                        >
                          {labels.form.clearProduct}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-sm text-muted-foreground">
                        {labels.form.noProductSelected}
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setProductPickerOpen(true)}
                      >
                        {labels.form.selectProduct}
                      </Button>
                    </div>
                  )}
                </div>
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
                />
              </Field>

              {!isManualMode ? (
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
                    maxLength={1000}
                  />
                </Field>
              ) : null}
            </FieldGroup>
          ) : null}

          {step === 4 ? (
            <div className="space-y-4">
              <div className="rounded-3xl border border-border/60 bg-muted/10 p-4">
                <p className="text-sm font-medium">
                  {labels.wizard.reviewTitle}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {labels.wizard.reviewDescription}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge variant="outline">
                    {isManualMode
                      ? labels.mode.badgeManual
                      : labels.mode.badgeAi}
                  </Badge>
                  <Badge variant="outline">
                    {labels.goals[form.campaignGoal]}
                  </Badge>
                  <Badge variant="outline">
                    {labels.channels[form.channel]}
                  </Badge>
                  <Badge variant="outline">{labels.tones[form.tone]}</Badge>
                  <Badge variant="outline">
                    {labels.audiences[form.audience]}
                  </Badge>
                  {form.productName ? (
                    <Badge variant="secondary">{form.productName}</Badge>
                  ) : null}
                </div>
              </div>

              {isManualMode ? (
                <>
                  <MarketingManualCampaignFields
                    labels={labels.manual}
                    channel={form.channel}
                    value={manualDraft}
                    onChange={setManualDraft}
                  />

                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      disabled={isSaving || !isManualDraftValid}
                      onClick={runSave}
                    >
                      {labels.actions.saveCampaign}
                    </Button>
                  </div>
                </>
              ) : isGenerating ? (
                <div className="space-y-3">
                  <Skeleton className="h-6 w-2/3" />
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              ) : result ? (
                <>
                  <MarketingCampaignResult
                    labels={labels.result}
                    channel={form.channel}
                    result={result}
                  />

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
                      disabled={isGenerating}
                      onClick={runGenerate}
                    >
                      {labels.actions.regenerate}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      disabled={isSaving}
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
                <p className="text-sm text-muted-foreground">
                  {labels.wizard.generateHint}
                </p>
              )}
            </div>
          ) : null}
        </CardContent>
      </Card>

      <div className="flex flex-wrap justify-between gap-3">
        <Button
          type="button"
          variant="outline"
          className="gap-2"
          disabled={step === 1 || isGenerating}
          onClick={goBack}
        >
          <TbChevronLeft className="size-4" aria-hidden />
          {labels.actions.previous}
        </Button>

        {step < 4 ? (
          <Button
            type="button"
            className="gap-2"
            disabled={!canAdvanceStep || isGenerating || !restaurantId}
            onClick={goNext}
          >
            {step === 3 && !isManualMode ? (
              <>
                <TbWand className="size-4" aria-hidden />
                {isGenerating
                  ? labels.actions.generating
                  : labels.actions.generate}
              </>
            ) : (
              <>
                {labels.actions.next}
                <TbChevronRight className="size-4" aria-hidden />
              </>
            )}
          </Button>
        ) : null}
      </div>

      <MarketingMenuProductPickerDialog
        open={productPickerOpen}
        onOpenChange={setProductPickerOpen}
        labels={labels.productPicker}
        currency={currency}
        menuItems={menuItems}
        selectedMenuItemId={selectedMenuItem?.id}
        onSelectMenuItem={handleSelectMenuItem}
      />
    </main>
  );
}
