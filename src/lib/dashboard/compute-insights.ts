import type { DashboardInsight } from "@/lib/dashboard/data";

export type DashboardInsightLabels = {
  kitchenBacklog: { title: string; description: string };
  upcomingReservations: { title: string; description: string };
  revenueUp: { title: string; description: string };
  revenueDown: { title: string; description: string };
  slowPrep: { title: string; description: string };
  pendingReservations: { title: string; description: string };
};

export type DashboardInsightInput = {
  preparingCount: number;
  openOrdersCount: number;
  reservationsNextThreeHours: number;
  revenueTodayCents: number;
  revenueYesterdayCents: number;
  avgPrepCurrent: number;
  avgPrepPrevious: number;
  pendingReservationsCount: number;
};

function replaceTokens(
  template: string,
  values: Record<string, string | number>,
): string {
  return Object.entries(values).reduce(
    (result, [key, value]) => result.replace(`{${key}}`, String(value)),
    template,
  );
}

export function computeDashboardInsights(
  input: DashboardInsightInput,
  labels: DashboardInsightLabels,
): DashboardInsight[] {
  const insights: DashboardInsight[] = [];

  if (input.preparingCount >= 2) {
    insights.push({
      id: "kitchen-backlog",
      title: labels.kitchenBacklog.title,
      description: replaceTokens(labels.kitchenBacklog.description, {
        count: input.preparingCount,
        open: input.openOrdersCount,
      }),
      priority: input.preparingCount >= 4 ? "high" : "medium",
      href: "/dashboard/kitchen",
    });
  }

  if (input.reservationsNextThreeHours > 0) {
    insights.push({
      id: "upcoming-reservations",
      title: labels.upcomingReservations.title,
      description: replaceTokens(labels.upcomingReservations.description, {
        count: input.reservationsNextThreeHours,
        hours: 3,
      }),
      priority: input.reservationsNextThreeHours >= 3 ? "medium" : "low",
      href: "/dashboard/reservations",
    });
  }

  if (input.pendingReservationsCount > 0) {
    insights.push({
      id: "pending-reservations",
      title: labels.pendingReservations.title,
      description: replaceTokens(labels.pendingReservations.description, {
        count: input.pendingReservationsCount,
      }),
      priority: "medium",
      href: "/dashboard/reservations?status=PENDING",
    });
  }

  if (input.revenueYesterdayCents > 0) {
    const percent = Math.round(
      ((input.revenueTodayCents - input.revenueYesterdayCents) /
        input.revenueYesterdayCents) *
        100,
    );

    if (percent >= 15) {
      insights.push({
        id: "revenue-up",
        title: labels.revenueUp.title,
        description: replaceTokens(labels.revenueUp.description, {
          percent,
        }),
        priority: "low",
        href: "/dashboard/analytics",
      });
    } else if (percent <= -15) {
      insights.push({
        id: "revenue-down",
        title: labels.revenueDown.title,
        description: replaceTokens(labels.revenueDown.description, {
          percent: Math.abs(percent),
        }),
        priority: "high",
        href: "/dashboard/analytics",
      });
    }
  }

  if (
    input.avgPrepCurrent > 0 &&
    input.avgPrepPrevious > 0 &&
    input.avgPrepCurrent - input.avgPrepPrevious >= 5
  ) {
    const delta = input.avgPrepCurrent - input.avgPrepPrevious;
    insights.push({
      id: "slow-prep",
      title: labels.slowPrep.title,
      description: replaceTokens(labels.slowPrep.description, {
        minutes: delta,
        current: input.avgPrepCurrent,
      }),
      priority: delta >= 10 ? "high" : "medium",
      href: "/dashboard/kitchen",
    });
  }

  return insights.slice(0, 4);
}
