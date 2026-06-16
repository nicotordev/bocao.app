import Link from "next/link";
import { TbCalendarPlus, TbPlus } from "react-icons/tb";
import { getTranslations } from "next-intl/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { PermissionKey } from "@/lib/rbac/permissions";
import { PERMISSIONS } from "@/lib/rbac/permissions";

type DashboardHomeHeaderProps = {
  todayLabel: string;
  firstName: string;
  restaurantName: string;
  permissions: readonly PermissionKey[];
  openOrdersCount?: number;
  upcomingReservationsCount?: number;
};

export async function DashboardHomeHeader({
  todayLabel,
  firstName,
  restaurantName,
  permissions,
  openOrdersCount = 0,
  upcomingReservationsCount = 0,
}: DashboardHomeHeaderProps) {
  const t = await getTranslations("dashboard");
  const tHome = await getTranslations("dashboard.home");

  const permissionSet = new Set(permissions);
  const canCreateOrder = permissionSet.has(PERMISSIONS.ORDERS_WRITE);
  const canCreateReservation = permissionSet.has(
    PERMISSIONS.RESERVATIONS_WRITE,
  );
  const showActions = canCreateOrder || canCreateReservation;

  // Generate dynamic contextual summary sentence
  let summaryText = "";
  if (openOrdersCount > 0 && upcomingReservationsCount > 0) {
    summaryText = t("heroSummary", {
      openOrders: openOrdersCount,
      upcomingReservations: upcomingReservationsCount,
    });
  } else if (openOrdersCount > 0) {
    summaryText = t("heroSummaryOrdersOnly", {
      openOrders: openOrdersCount,
    });
  } else if (upcomingReservationsCount > 0) {
    summaryText = t("heroSummaryReservationsOnly", {
      upcomingReservations: upcomingReservationsCount,
    });
  } else {
    summaryText = t("heroSummaryEmpty");
  }

  return (
    <section className="relative overflow-hidden rounded-3xl border border-border/40 bg-gradient-to-br from-card via-card/98 to-primary/5 dark:to-primary/10 p-6 md:p-8">
      {/* Decorative background glow */}
      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between relative z-10">
        <div className="flex-1 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="outline"
              className="capitalize border-primary/20 bg-primary/5 text-primary-foreground/90 font-medium"
            >
              {todayLabel}
            </Badge>
            <Badge
              variant="outline"
              className="gap-1.5 border-emerald-500/20 bg-emerald-500/5 text-emerald-500 font-medium dark:text-emerald-400"
            >
              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {tHome("statusActive")}
            </Badge>
          </div>

          <div className="space-y-1">
            <h2 className="font-heading text-3xl font-semibold tracking-tight md:text-4xl">
              {t("greeting", { name: firstName })} 👋
            </h2>
            <p className="text-sm text-muted-foreground md:text-base max-w-xl font-normal leading-relaxed">
              <span className="font-medium text-foreground">{restaurantName}</span>
              {" · "}
              {summaryText}
            </p>
          </div>
        </div>

        {showActions ? (
          <div className="flex flex-wrap gap-2.5 shrink-0">
            {canCreateOrder ? (
              <Button className="gap-2 rounded-xl shadow-xs" asChild>
                <Link href="/dashboard/orders/new">
                  <TbPlus className="size-4" aria-hidden />
                  {tHome("quickActions.newOrder")}
                </Link>
              </Button>
            ) : null}
            {canCreateReservation ? (
              <Button variant="outline" className="gap-2 rounded-xl shadow-xs" asChild>
                <Link href="/dashboard/reservations?new=1">
                  <TbCalendarPlus className="size-4" aria-hidden />
                  {tHome("quickActions.newReservation")}
                </Link>
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}
