import { format } from "date-fns";
import { enUS, es } from "date-fns/locale";
import { getLocale, getTranslations } from "next-intl/server";
import { AiInsightsCard } from "@/components/dashboard/ai-insights-card";
import { MetricCard } from "@/components/dashboard/metric-card";
import { RecentOrdersList } from "@/components/dashboard/recent-orders-list";
import { TeamActivityCard } from "@/components/dashboard/team-activity-card";
import { UpcomingReservationsList } from "@/components/dashboard/upcoming-reservations-list";
import { WhatsappStatusCard } from "@/components/dashboard/whatsapp-status-card";
import { getDashboardContext } from "@/lib/dashboard/context";
import { getDashboardHomeData } from "@/lib/dashboard/queries";
import { Badge } from "@/components/ui/badge";

export default async function DashboardPage() {
  const t = await getTranslations("dashboard");
  const tMetrics = await getTranslations("dashboard.metrics");
  const locale = await getLocale();
  const dateFnsLocale = locale === "es" ? es : enUS;

  const context = await getDashboardContext();
  const data = await getDashboardHomeData(context?.activeRestaurant ?? null, {
    locale,
    metricLabels: {
      revenueToday: tMetrics("revenueToday"),
      openOrders: tMetrics("openOrders"),
      upcomingReservations: tMetrics("upcomingReservations"),
      avgPrepTime: tMetrics("avgPrepTime"),
    },
  });

  const todayLabel = format(new Date(), t("dateFormat"), {
    locale: dateFnsLocale,
  });

  const firstName =
    context?.user.name.split(" ").filter(Boolean)[0] ?? t("greetingFallback");

  return (
    <main className="flex flex-col gap-6 p-4 md:p-6">
      <section className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Badge variant="outline" className="mb-2 capitalize">
            {todayLabel}
          </Badge>
          <h2 className="font-heading text-2xl font-semibold tracking-tight md:text-3xl">
            {t("greeting", { name: firstName })}
          </h2>
          <p className="text-sm text-muted-foreground md:text-base">
            {t("summary", {
              restaurant:
                context?.activeRestaurant?.name ?? t("summaryFallback"),
            })}
          </p>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {data.metrics.map((metric) => (
          <MetricCard key={metric.id} metric={metric} />
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <AiInsightsCard insights={data.insights} />
        </div>
        <WhatsappStatusCard
          connected={data.whatsapp.connected}
          unreadCount={data.whatsapp.unreadCount}
          lastMessageAt={data.whatsapp.lastMessageAt}
          responseRate={data.whatsapp.responseRate}
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <RecentOrdersList orders={data.recentOrders} />
        <UpcomingReservationsList reservations={data.upcomingReservations} />
      </section>

      <section>
        <TeamActivityCard members={data.teamActivity} />
      </section>
    </main>
  );
}
