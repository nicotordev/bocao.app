import type { MarketingAiLabels } from "@/components/dashboard/marketing/types";
import {
  CAMPAIGN_GOALS,
  MARKETING_AUDIENCES,
  MARKETING_CHANNELS,
  MARKETING_TONES,
} from "@/lib/marketing/ai/schema";
import type { getTranslations } from "next-intl/server";

type MarketingAiTranslator = Awaited<
  ReturnType<typeof getTranslations<"dashboard.marketingAi">>
>;

export function buildMarketingAiLabels(
  t: MarketingAiTranslator,
): MarketingAiLabels {
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

  return {
    header: {
      title: t("title"),
      subtitle: t("description"),
    },
    actions: {
      newCampaign: t("newCampaign"),
      newManualCampaign: t("newManualCampaign"),
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
      back: t("actions.back"),
      next: t("actions.next"),
      previous: t("actions.previous"),
      viewCampaign: t("actions.viewCampaign"),
      createFirst: t("actions.createFirst"),
    },
    form: {
      title: t("form.title"),
      campaignGoal: t("form.campaignGoal"),
      channel: t("form.channel"),
      tone: t("form.tone"),
      audience: t("form.audience"),
      productName: t("form.productName"),
      productNamePlaceholder: t("form.productNamePlaceholder"),
      selectProduct: t("form.selectProduct"),
      changeProduct: t("form.changeProduct"),
      clearProduct: t("form.clearProduct"),
      noProductSelected: t("form.noProductSelected"),
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
    overview: {
      totalCampaigns: t("overview.totalCampaigns"),
      recentCampaigns: t("overview.recentCampaigns"),
      channelsUsed: t("overview.channelsUsed"),
      emptyTitle: t("overview.emptyTitle"),
      emptyDescription: t("overview.emptyDescription"),
    },
    wizard: {
      title: t("wizard.title"),
      subtitle: t("wizard.subtitle"),
      stepProgress: t.raw("wizard.stepProgress"),
      steps: {
        goal: t("wizard.steps.goal"),
        audience: t("wizard.steps.audience"),
        details: t("wizard.steps.details"),
        result: t("wizard.steps.result"),
      },
      reviewTitle: t("wizard.reviewTitle"),
      reviewDescription: t("wizard.reviewDescription"),
      generateHint: t("wizard.generateHint"),
      manualHint: t("wizard.manualHint"),
      modeTitle: t("wizard.modeTitle"),
      modeDescription: t("wizard.modeDescription"),
    },
    mode: {
      ai: t("mode.ai"),
      manual: t("mode.manual"),
      aiDescription: t("mode.aiDescription"),
      manualDescription: t("mode.manualDescription"),
      badgeAi: t("mode.badgeAi"),
      badgeManual: t("mode.badgeManual"),
    },
    manual: {
      title: t("manual.title"),
      titlePlaceholder: t("manual.titlePlaceholder"),
      mainMessage: t("manual.mainMessage"),
      mainMessagePlaceholder: t("manual.mainMessagePlaceholder"),
      callToAction: t("manual.callToAction"),
      callToActionPlaceholder: t("manual.callToActionPlaceholder"),
      shortVersion: t("manual.shortVersion"),
      shortVersionPlaceholder: t("manual.shortVersionPlaceholder"),
      hashtags: t("manual.hashtags"),
      hashtagsPlaceholder: t("manual.hashtagsPlaceholder"),
      sendingRecommendation: t("manual.sendingRecommendation"),
      sendingRecommendationPlaceholder: t(
        "manual.sendingRecommendationPlaceholder",
      ),
    },
    productPicker: {
      title: t("productPicker.title"),
      description: t("productPicker.description"),
      emptyTitle: t("productPicker.emptyTitle"),
      emptyDescription: t("productPicker.emptyDescription"),
      footerHint: t("productPicker.footerHint"),
      selectProduct: t("productPicker.selectProduct"),
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
}
