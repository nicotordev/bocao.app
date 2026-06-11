import type {
  AnalyticsChannel,
  AnalyticsDashboardData,
  AnalyticsInsight,
} from "@/lib/analytics/types";

type InsightTemplateLabels = {
  revenueUp: string;
  revenueDown: string;
  topChannel: string;
  topProduct: string;
  peakHours: string;
  cancellationHigh: string;
  channelLabels: Record<AnalyticsChannel, string>;
};

export function computeAnalyticsInsights(
  data: Pick<
    AnalyticsDashboardData,
    "overview" | "channelBreakdown" | "topProducts" | "peakHours"
  >,
  labels: InsightTemplateLabels,
): AnalyticsInsight[] {
  const insights: AnalyticsInsight[] = [];

  if (data.overview.revenueChangePercent !== null) {
    const percent = Math.abs(data.overview.revenueChangePercent);
    insights.push({
      id: "revenue-trend",
      message:
        data.overview.revenueChangePercent >= 0
          ? labels.revenueUp.replace("{percent}", String(percent))
          : labels.revenueDown.replace("{percent}", String(percent)),
    });
  }

  const topChannel = [...data.channelBreakdown].sort(
    (left, right) => right.revenue - left.revenue,
  )[0];

  if (topChannel && topChannel.revenue > 0) {
    insights.push({
      id: "top-channel",
      message: labels.topChannel.replace(
        "{channel}",
        labels.channelLabels[topChannel.channel],
      ),
    });
  }

  const topProduct = data.topProducts[0];
  if (topProduct) {
    insights.push({
      id: "top-product",
      message: labels.topProduct.replace("{product}", topProduct.name),
    });
  }

  const peakWindow = findPeakHourWindow(data.peakHours);
  if (peakWindow) {
    insights.push({
      id: "peak-hours",
      message: labels.peakHours
        .replace("{start}", peakWindow.start)
        .replace("{end}", peakWindow.end),
    });
  }

  if (data.overview.cancellationRate >= 0.15) {
    insights.push({
      id: "cancellation-rate",
      message: labels.cancellationHigh.replace(
        "{percent}",
        String(Math.round(data.overview.cancellationRate * 100)),
      ),
    });
  }

  return insights;
}

function findPeakHourWindow(
  peakHours: AnalyticsDashboardData["peakHours"],
): { start: string; end: string } | null {
  const ranked = [...peakHours].sort((left, right) => right.orders - left.orders);
  const top = ranked[0];

  if (!top || top.orders === 0) {
    return null;
  }

  const startHour = top.hour;
  const endHour = (startHour + 2) % 24;

  return {
    start: formatHourLabel(startHour),
    end: formatHourLabel(endHour),
  };
}

function formatHourLabel(hour: number): string {
  return `${String(hour).padStart(2, "0")}:00`;
}
