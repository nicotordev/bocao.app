import { getTranslations } from "next-intl/server";
import { MarketingAiPageClient } from "@/components/dashboard/marketing/marketing-ai-page-client";
import type { MarketingAiLabels } from "@/components/dashboard/marketing/types";
import { getDashboardContext } from "@/lib/dashboard/context";
import {
  CAMPAIGN_GOALS,
  MARKETING_AUDIENCES,
  MARKETING_CHANNELS,
  MARKETING_TONES,
} from "@/lib/marketing/ai/schema";
import { listMarketingCampaigns } from "@/lib/marketing/repository";
import { PERMISSIONS } from "@/lib/rbac/permissions";

export default async function MarketingAiPage() {
  const t = await getTranslations("dashboard.marketingAi");
  const context = await getDashboardContext();
  const restaurantId = context?.activeRestaurant?.id ?? "";
  const restaurantName = context?.activeRestaurant?.name ?? "";
  const canRead =
    context?.membership.permissions.includes(PERMISSIONS.MARKETING_READ) ??
    false;
  const canEdit =
    context?.membership.permissions.includes(PERMISSIONS.MARKETING_WRITE) ??
    false;

  const goals = Object.fromEntries(
    CAMPAIGN_GOALS.map((goal) => [goal, t(`goals.${goal}`)]),
  ) as MarketingAiLabels["goals"];

  const channels = Object.fromEntries(
    MARKETING_CHANNELS.map((channel) => [channel, t(`channels.${channel}`)]),
  ) as MarketingAiLabels["channels"];

  const tones = Object.fromEntries(
    MARKETING_TONES.map((tone) => [tone, t(`tones.${tone}`)]),
  ) as MarketingAiLabels["tones"];

  const audiences = Object.fromEntries(
    MARKETING_AUDIENCES.map((audience) => [
      audience,
      t(`audiences.${audience}`),
    ]),
  ) as MarketingAiLabels["audiences"];

  const labels: MarketingAiLabels = {
    header: {
      title: t("title"),
      subtitle: t("description"),
    },
    actions: {
      newCampaign: t("newCampaign"),
      viewHistory: t("viewHistory"),
      generate: t("generate"),
      copy: t("copy"),
      regenerate: t("regenerate"),
      saveCampaign: t("saveCampaign"),
      useWhatsapp: t("useWhatsapp"),
      generating: t("generating"),
      copySuccess: t("copySuccess"),
      saveSuccess: t("saveSuccess"),
      comingSoon: t("comingSoon"),
    },
    form: {
      title: t("form.title"),
      campaignGoal: t("form.campaignGoal"),
      channel: t("form.channel"),
      tone: t("form.tone"),
      audience: t("form.audience"),
      productName: t("form.productName"),
      productNamePlaceholder: t("form.productNamePlaceholder"),
      promotion: t("form.promotion"),
      promotionPlaceholder: t("form.promotionPlaceholder"),
      extraInstructions: t("form.extraInstructions"),
      extraInstructionsPlaceholder: t("form.extraInstructionsPlaceholder"),
    },
    goals,
    channels,
    tones,
    audiences,
    result: {
      title: t("result.title"),
      emptyTitle: t("result.emptyTitle"),
      emptyDescription: t("result.emptyDescription"),
      suggestedTitle: t("result.suggestedTitle"),
      mainMessage: t("result.mainMessage"),
      alternatives: t("result.alternatives"),
      callToAction: t("result.callToAction"),
      hashtags: t("result.hashtags"),
      shortVersion: t("result.shortVersion"),
      sendingRecommendation: t("result.sendingRecommendation"),
    },
    history: {
      title: t("history.title"),
      emptyTitle: t("history.emptyTitle"),
      emptyDescription: t("history.emptyDescription"),
    },
    quickActions: {
      title: t("quickActions.title"),
      reactivation: t("quickActions.reactivation"),
      birthday: t("quickActions.birthday"),
      slowHours: t("quickActions.slowHours"),
      newProduct: t("quickActions.newProduct"),
      whatsappPromo: t("quickActions.whatsappPromo"),
    },
    permissions: {
      deniedTitle: t("permissions.deniedTitle"),
      deniedDescription: t("permissions.deniedDescription"),
      readOnlyHint: t("permissions.readOnlyHint"),
    },
    errors: {
      forbidden: t("errors.forbidden"),
      invalidInput: t("errors.invalidInput"),
      openaiNotConfigured: t("errors.openaiNotConfigured"),
      openaiFailed: t("errors.openaiFailed"),
      invalidResponse: t("errors.invalidResponse"),
      saveFailed: t("errors.saveFailed"),
      generic: t("errors.generic"),
    },
  };

  if (!canRead) {
    return (
      <main className="flex flex-col gap-6 p-4 md:p-6">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            {labels.header.title}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {labels.header.subtitle}
          </p>
        </div>
        <div className="rounded-3xl border border-border bg-card p-6">
          <h2 className="font-medium">{labels.permissions.deniedTitle}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {labels.permissions.deniedDescription}
          </p>
        </div>
      </main>
    );
  }

  const initialCampaigns =
    restaurantId.length > 0 ? await listMarketingCampaigns(restaurantId) : [];

  return (
    <MarketingAiPageClient
      labels={labels}
      restaurantId={restaurantId}
      restaurantName={restaurantName}
      canEdit={canEdit}
      initialCampaigns={initialCampaigns}
    />
  );
}
