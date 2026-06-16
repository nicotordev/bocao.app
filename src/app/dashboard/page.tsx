import { format } from "date-fns";
import { enUS, es } from "date-fns/locale";
import { getTranslations } from "next-intl/server";
import { AiInsightsCard } from "@/components/dashboard/ai-insights-card";
import { DashboardHomeHeader } from "@/components/dashboard/home/dashboard-home-header";
import { DashboardNoRestaurant } from "@/components/dashboard/home/dashboard-no-restaurant";
import { MetricCard } from "@/components/dashboard/metric-card";
import { RecentOrdersList } from "@/components/dashboard/recent-orders-list";
import { TeamActivityCard } from "@/components/dashboard/team-activity-card";
import { UpcomingReservationsList } from "@/components/dashboard/upcoming-reservations-list";
import { WhatsappStatusCard } from "@/components/dashboard/whatsapp-status-card";
import { getDashboardContext } from "@/lib/dashboard/context";
import { getDashboardHomeFormatOptions } from "@/lib/dashboard/format-options";
import { getDashboardHomeData } from "@/lib/dashboard/queries";
import { Badge } from "@/components/ui/badge";

export default async function DashboardPage() {
  const t = await getTranslations("dashboard");
  const homeFormat = await getDashboardHomeFormatOptions();
  const dateFnsLocale = homeFormat.locale === "es" ? es : enUS;

  const context = await getDashboardContext();
  const restaurantId = context?.activeRestaurant?.id ?? "";

  const data = await getDashboardHomeData(context?.activeRestaurant ?? null, {
    locale: homeFormat.locale,
    notAvailable: homeFormat.notAvailable,
    metricLabels: homeFormat.metricLabels,
    insightLabels: homeFormat.insightLabels,
    customerLabels: homeFormat.customerLabels,
  });

  const todayLabel = format(new Date(), t("dateFormat"), {
    locale: dateFnsLocale,
  });

  const firstName = context?.user.needsProfileName
    ? t("greetingFallback")
    : (context?.user.name.split(" ").filter(Boolean)[0] ??
      t("greetingFallback"));

  const hasRestaurant = Boolean(context?.activeRestaurant);
  const tMetrics = await getTranslations("dashboard.metrics");

  return (
    <main className="flex flex-col gap-6 p-4 md:p-6">
      {hasRestaurant ? (
        <DashboardHomeHeader
          todayLabel={todayLabel}
          firstName={firstName}
          restaurantName={
            context?.activeRestaurant?.name ?? t("summaryFallback")
          }
          permissions={context?.membership.permissions ?? []}
        />
      ) : (
        <section className="flex flex-col gap-3">
          <Badge variant="outline" className="mb-2 w-fit capitalize">
            {todayLabel}
          </Badge>
          <h2 className="font-heading text-2xl font-semibold tracking-tight md:text-3xl">
            {t("greeting", { name: firstName })}
          </h2>
          <p className="text-sm text-muted-foreground md:text-base">
            {t("summary", {
              restaurant: t("summaryFallback"),
            })}
          </p>
        </section>
      )}

      {!hasRestaurant ? (
        <section>{await DashboardNoRestaurant()}</section>
      ) : null}

      {hasRestaurant ? (
        <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {data.metrics.map((metric) => (
              <MetricCard
                key={metric.id}
                metric={metric}
                viewLabel={tMetrics("viewDetail")}
              />
            ))}
          </section>

          <section className="grid items-stretch gap-4 xl:grid-cols-3">
            <div className="xl:col-span-2">
              {await AiInsightsCard({ insights: data.insights })}
            </div>
            {await WhatsappStatusCard({
              connected: data.whatsapp.connected,
              unreadCount: data.whatsapp.unreadCount,
              lastMessageAt: data.whatsapp.lastMessageAt,
              responseRate: data.whatsapp.responseRate,
            })}
          </section>

          <section className="grid items-stretch gap-4 lg:grid-cols-2">
            {await RecentOrdersList({
              orders: data.recentOrders,
              relativeMinutes: homeFormat.metricLabels.relativeMinutes,
            })}
            {await UpcomingReservationsList({
              reservations: data.upcomingReservations,
            })}
          </section>

          <section>
            {await TeamActivityCard({ members: data.teamActivity })}
          </section>
        </>
      ) : null}
    </main>
  );
}
