import type {
  CAMPAIGN_GOALS,
  MARKETING_AUDIENCES,
  MARKETING_CHANNELS,
  MARKETING_TONES,
} from "@/lib/marketing/ai/schema";
import type { MarketingCampaignRecord } from "@/lib/marketing/ai/types";
import type { MenuItemOption } from "@/lib/menu/types";

export type MarketingAiOptionMap<T extends string> = Record<T, string>;

export type MarketingAiLabels = {
  header: {
    title: string;
    subtitle: string;
  };
  actions: {
    newCampaign: string;
    newManualCampaign: string;
    viewHistory: string;
    generate: string;
    copy: string;
    regenerate: string;
    saveCampaign: string;
    useWhatsapp: string;
    generating: string;
    copySuccess: string;
    saveSuccess: string;
    comingSoon: string;
    back: string;
    next: string;
    previous: string;
    viewCampaign: string;
    createFirst: string;
  };
  form: {
    title: string;
    campaignGoal: string;
    channel: string;
    tone: string;
    audience: string;
    productName: string;
    productNamePlaceholder: string;
    selectProduct: string;
    changeProduct: string;
    clearProduct: string;
    noProductSelected: string;
    promotion: string;
    promotionPlaceholder: string;
    extraInstructions: string;
    extraInstructionsPlaceholder: string;
  };
  goals: MarketingAiOptionMap<(typeof CAMPAIGN_GOALS)[number]>;
  channels: MarketingAiOptionMap<(typeof MARKETING_CHANNELS)[number]>;
  tones: MarketingAiOptionMap<(typeof MARKETING_TONES)[number]>;
  audiences: MarketingAiOptionMap<(typeof MARKETING_AUDIENCES)[number]>;
  result: {
    title: string;
    emptyTitle: string;
    emptyDescription: string;
    suggestedTitle: string;
    mainMessage: string;
    alternatives: string;
    callToAction: string;
    hashtags: string;
    shortVersion: string;
    sendingRecommendation: string;
  };
  history: {
    title: string;
    emptyTitle: string;
    emptyDescription: string;
  };
  overview: {
    totalCampaigns: string;
    recentCampaigns: string;
    channelsUsed: string;
    emptyTitle: string;
    emptyDescription: string;
  };
  wizard: {
    title: string;
    subtitle: string;
    stepProgress: string;
    steps: {
      goal: string;
      audience: string;
      details: string;
      result: string;
    };
    reviewTitle: string;
    reviewDescription: string;
    generateHint: string;
    manualHint: string;
    modeTitle: string;
    modeDescription: string;
  };
  mode: {
    ai: string;
    manual: string;
    aiDescription: string;
    manualDescription: string;
    badgeAi: string;
    badgeManual: string;
  };
  manual: {
    title: string;
    titlePlaceholder: string;
    mainMessage: string;
    mainMessagePlaceholder: string;
    callToAction: string;
    callToActionPlaceholder: string;
    shortVersion: string;
    shortVersionPlaceholder: string;
    hashtags: string;
    hashtagsPlaceholder: string;
    sendingRecommendation: string;
    sendingRecommendationPlaceholder: string;
  };
  productPicker: {
    title: string;
    description: string;
    emptyTitle: string;
    emptyDescription: string;
    footerHint: string;
    selectProduct: string;
  };
  quickActions: {
    title: string;
    reactivation: string;
    birthday: string;
    slowHours: string;
    newProduct: string;
    whatsappPromo: string;
  };
  permissions: {
    deniedTitle: string;
    deniedDescription: string;
    readOnlyHint: string;
  };
  errors: {
    forbidden: string;
    invalidInput: string;
    openaiNotConfigured: string;
    openaiFailed: string;
    invalidResponse: string;
    saveFailed: string;
    generic: string;
  };
};

export type MarketingAiPageClientProps = {
  labels: MarketingAiLabels;
  restaurantId: string;
  restaurantName: string;
  canEdit: boolean;
  campaigns: MarketingCampaignRecord[];
};

export type MarketingAiNewPageClientProps = {
  labels: MarketingAiLabels;
  restaurantId: string;
  restaurantName: string;
  currency: string;
  canEdit: boolean;
  menuItems: MenuItemOption[];
  initialPreset?: string;
  initialMode?: "ai" | "manual";
};
