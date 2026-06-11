import "server-only";

import { zodTextFormat } from "openai/helpers/zod";
import {
  getAnalyticsModel,
  getOpenAIClient,
} from "@/lib/ai/openai-client";
import { computeAnalyticsInsights } from "@/lib/analytics/compute-insights";
import type {
  AnalyticsChannel,
  AnalyticsDashboardData,
  AnalyticsInsight,
} from "@/lib/analytics/types";
import {
  analyticsInsightsResponseSchema,
} from "@/lib/analytics/ai/schema";

type InsightTemplateLabels = {
  revenueUp: string;
  revenueDown: string;
  topChannel: string;
  topProduct: string;
  peakHours: string;
  cancellationHigh: string;
  channelLabels: Record<AnalyticsChannel, string>;
};

type GenerateAnalyticsInsightsInput = {
  restaurantName: string;
  locale: string;
  currency: string;
  dashboard: Omit<AnalyticsDashboardData, "insights">;
  fallbackLabels: InsightTemplateLabels;
};

export type GeneratedAnalyticsInsights = {
  insights: AnalyticsInsight[];
  source: "ai" | "rules";
};

function buildSystemPrompt(locale: string): string {
  const language = locale === "es" ? "Spanish" : "English";

  return `You are a restaurant operations analyst for Bocao.app.
Write ${language} insights that are specific, actionable, and grounded only in the provided metrics.
Do not invent numbers, products, channels, or trends that are not supported by the data.
Prefer 3 to 5 concise insights. Each insight should be one or two short sentences.
Focus on revenue, orders, channels, products, peak hours, cancellations, customers, and kitchen performance when relevant.
Respond only with valid JSON matching the required schema.`;
}

function buildUserPrompt(input: GenerateAnalyticsInsightsInput): string {
  const { dashboard, restaurantName, currency } = input;
  const topPeakHours = [...dashboard.peakHours]
    .sort((left, right) => right.orders - left.orders)
    .slice(0, 5);

  const payload = {
    restaurant: restaurantName,
    currency,
    period: dashboard.filters,
    overview: dashboard.overview,
    channelBreakdown: dashboard.channelBreakdown,
    topProducts: dashboard.topProducts.slice(0, 5),
    peakHours: topPeakHours,
    customerInsights: dashboard.customerInsights,
    kitchenPerformance: dashboard.kitchenPerformance,
    revenueSeries: dashboard.revenueSeries,
  };

  return [
    "Analyze the following restaurant analytics snapshot and produce operational insights.",
    JSON.stringify(payload, null, 2),
  ].join("\n\n");
}

function hasInsightData(dashboard: Omit<AnalyticsDashboardData, "insights">): boolean {
  return (
    dashboard.overview.totalOrders > 0 ||
    dashboard.overview.totalRevenue > 0 ||
    dashboard.customerInsights.reservationCount > 0
  );
}

export async function generateAnalyticsInsights(
  input: GenerateAnalyticsInsightsInput,
): Promise<GeneratedAnalyticsInsights> {
  if (!hasInsightData(input.dashboard)) {
    return { insights: [], source: "rules" };
  }

  const fallback = (): GeneratedAnalyticsInsights => ({
    insights: computeAnalyticsInsights(input.dashboard, input.fallbackLabels),
    source: "rules",
  });

  try {
    const client = getOpenAIClient();
    const response = await client.responses.parse({
      model: getAnalyticsModel(),
      instructions: buildSystemPrompt(input.locale),
      input: buildUserPrompt(input),
      text: {
        format: zodTextFormat(
          analyticsInsightsResponseSchema,
          "analytics_insights",
        ),
      },
    });

    const parsed = response.output_parsed;

    if (parsed?.insights?.length) {
      return { insights: parsed.insights, source: "ai" };
    }

    const fallbackText = response.output_text?.trim();
    if (fallbackText) {
      try {
        const json = JSON.parse(fallbackText) as unknown;
        const validated = analyticsInsightsResponseSchema.safeParse(json);
        if (validated.success) {
          return { insights: validated.data.insights, source: "ai" };
        }
      } catch {
        // use rule-based fallback below
      }
    }
  } catch {
    // OpenAI unavailable or misconfigured — use rule-based fallback.
  }

  return fallback();
}
