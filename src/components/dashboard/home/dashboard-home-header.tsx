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
};

export async function DashboardHomeHeader({
  todayLabel,
  firstName,
  restaurantName,
  permissions,
}: DashboardHomeHeaderProps) {
  const t = await getTranslations("dashboard");
  const tHome = await getTranslations("dashboard.home");

  const permissionSet = new Set(permissions);
  const canCreateOrder = permissionSet.has(PERMISSIONS.ORDERS_WRITE);
  const canCreateReservation = permissionSet.has(
    PERMISSIONS.RESERVATIONS_WRITE,
  );
  const showActions = canCreateOrder || canCreateReservation;

  return (
    <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <Badge variant="outline" className="mb-2 capitalize">
          {todayLabel}
        </Badge>
        <h2 className="font-heading text-2xl font-semibold tracking-tight md:text-3xl">
          {t("greeting", { name: firstName })}
        </h2>
        <p className="text-sm text-muted-foreground md:text-base">
          {t("summary", { restaurant: restaurantName })}
        </p>
      </div>
      {showActions ? (
        <div className="flex flex-wrap gap-2">
          {canCreateOrder ? (
            <Button className="gap-2" asChild>
              <Link href="/dashboard/orders/new">
                <TbPlus className="size-4" aria-hidden />
                {tHome("quickActions.newOrder")}
              </Link>
            </Button>
          ) : null}
          {canCreateReservation ? (
            <Button variant="outline" className="gap-2" asChild>
              <Link href="/dashboard/reservations?new=1">
                <TbCalendarPlus className="size-4" aria-hidden />
                {tHome("quickActions.newReservation")}
              </Link>
            </Button>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
