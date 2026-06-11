import "server-only";

import {
  findAnalyticsInsightSnapshot,
  parseStoredInsights,
} from "@/lib/analytics/insights/repository";

type ResolveAnalyticsInsightsInput = {
  restaurantId: string;
  locale: string;
  preset: string;
  channel: string;
  status: string;
};

export async function resolveAnalyticsInsights(
  input: ResolveAnalyticsInsightsInput,
) {
  const snapshot = await findAnalyticsInsightSnapshot({
    restaurantId: input.restaurantId,
    locale: input.locale,
    preset: input.preset,
    channel: input.channel,
    status: input.status,
  });

  if (!snapshot) {
    return [];
  }

  return parseStoredInsights(snapshot.insights);
}
