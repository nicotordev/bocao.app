import type {
  AnalyticsChannel,
  AnalyticsDashboardData,
} from "@/lib/analytics/types";

function escapeCsvValue(value: string | number): string {
  const raw = String(value);
  if (/[",\n]/.test(raw)) {
    return `"${raw.replace(/"/g, '""')}"`;
  }
  return raw;
}

type BuildAnalyticsCsvOptions = {
  channelLabels?: Partial<Record<AnalyticsChannel, string>>;
};

export function buildAnalyticsCsv(
  data: AnalyticsDashboardData,
  options?: BuildAnalyticsCsvOptions,
): string {
  const channelLabels = options?.channelLabels;
  const lines: string[] = [
    "section,key,value",
    `overview,totalRevenue,${data.overview.totalRevenue}`,
    `overview,totalOrders,${data.overview.totalOrders}`,
    `overview,averageTicket,${data.overview.averageTicket}`,
    `overview,uniqueCustomers,${data.overview.uniqueCustomers}`,
    `overview,cancellationRate,${data.overview.cancellationRate}`,
    `overview,averagePreparationMinutes,${data.overview.averagePreparationMinutes ?? ""}`,
    "",
    "revenueSeries,date,revenue,orders",
    ...data.revenueSeries.map(
      (point) =>
        `revenueSeries,${escapeCsvValue(point.date)},${point.revenue},${point.orders}`,
    ),
    "",
    "channelBreakdown,channel,orders,revenue",
    ...data.channelBreakdown.map(
      (row) =>
        `channelBreakdown,${escapeCsvValue(channelLabels?.[row.channel] ?? row.channel)},${row.orders},${row.revenue}`,
    ),
    "",
    "topProducts,name,quantity,revenue,sharePercent",
    ...data.topProducts.map(
      (product) =>
        `topProducts,${escapeCsvValue(product.name)},${product.quantity},${product.revenue},${product.sharePercent}`,
    ),
    "",
    "peakHours,hour,orders,revenue,averageTicket",
    ...data.peakHours.map(
      (hour) =>
        `peakHours,${hour.hour},${hour.orders},${hour.revenue},${hour.averageTicket}`,
    ),
  ];

  return `${lines.join("\n")}\n`;
}

export function buildAnalyticsCsvFilename(from: string, to: string): string {
  return `analytics-${from}-${to}.csv`;
}

export function downloadAnalyticsCsv(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
