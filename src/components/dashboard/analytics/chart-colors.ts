export const ANALYTICS_CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--primary)",
  "var(--destructive)",
  "var(--warning)",
  "oklch(0.62 0.22 280)",
  "oklch(0.68 0.18 220)",
  "oklch(0.75 0.16 45)",
  "oklch(0.58 0.2 330)",
] as const;

export function getAnalyticsChartColor(index: number): string {
  return ANALYTICS_CHART_COLORS[index % ANALYTICS_CHART_COLORS.length] ?? "var(--chart-1)";
}
