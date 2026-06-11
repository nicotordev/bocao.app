import type { AnalyticsChannel } from "@/lib/analytics/types";
import enMessages from "@/i18n/messages/en.json";
import esMessages from "@/i18n/messages/es.json";
import type { Locale } from "@/i18n/locales";

type AnalyticsMessages = (typeof esMessages)["dashboard"]["analytics"];

function getAnalyticsMessages(locale: string): AnalyticsMessages {
  return locale === "en"
    ? enMessages.dashboard.analytics
    : esMessages.dashboard.analytics;
}

export function getAnalyticsFallbackInsightLabels(locale: string) {
  const analytics = getAnalyticsMessages(locale);
  const channelLabels: Record<AnalyticsChannel, string> = {
    pos: analytics.channels.pos,
    whatsapp: analytics.channels.whatsapp,
    web: analytics.channels.web,
    delivery: analytics.channels.delivery,
    manual: analytics.channels.manual,
  };

  return {
    revenueUp: analytics.insights.revenueUp,
    revenueDown: analytics.insights.revenueDown,
    topChannel: analytics.insights.topChannel,
    topProduct: analytics.insights.topProduct,
    peakHours: analytics.insights.peakHours,
    cancellationHigh: analytics.insights.cancellationHigh,
    channelLabels,
  };
}

export function getAnalyticsKitchenStationLabels(locale: string) {
  const kitchen =
    locale === "en"
      ? enMessages.dashboard.kitchen
      : esMessages.dashboard.kitchen;

  return {
    grill: kitchen.stationTypes.grill,
    fryer: kitchen.stationTypes.fryer,
    sushi: kitchen.stationTypes.sushi,
    bar: kitchen.stationTypes.bar,
    desserts: kitchen.stationTypes.desserts,
    delivery_station: kitchen.stationTypes.delivery,
  };
}

export function getSupportedInsightLocales(): readonly Locale[] {
  return ["es", "en"] as const;
}
