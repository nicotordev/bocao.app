"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  TbBuildingStore,
  TbChefHat,
  TbUsers,
  TbBuildingSkyscraper,
} from "react-icons/tb";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { OrganizationsOverviewData } from "@/lib/dashboard/organizations-overview";
import { useSwitchRestaurantMutation } from "@/lib/query/restaurant/restaurant.mutations";

type OrganizationsOverviewPageClientProps = {
  data: OrganizationsOverviewData;
};

export function OrganizationsOverviewPageClient({
  data,
}: OrganizationsOverviewPageClientProps) {
  const t = useTranslations("dashboard.organizations");
  const switchRestaurantMutation = useSwitchRestaurantMutation();

  const handleSelectRestaurant = (restaurantId: string) => {
    switchRestaurantMutation.mutate(restaurantId);
  };

  return (
    <main className="flex flex-col gap-6 p-4 md:p-6">
      <section className="flex flex-col gap-2">
        <h1 className="font-heading text-2xl font-semibold tracking-tight md:text-3xl">
          {t("title")}
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground md:text-base">
          {t("subtitle")}
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="border-border/70 bg-card/80">
          <CardHeader className="pb-2">
            <CardDescription>{t("kpis.organizations")}</CardDescription>
            <CardTitle className="text-2xl">
              {data.totals.organizations}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-border/70 bg-card/80">
          <CardHeader className="pb-2">
            <CardDescription>{t("kpis.restaurants")}</CardDescription>
            <CardTitle className="text-2xl">
              {data.totals.restaurants}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-border/70 bg-card/80">
          <CardHeader className="pb-2">
            <CardDescription>{t("kpis.customers")}</CardDescription>
            <CardTitle className="text-2xl">{data.totals.customers}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-border/70 bg-card/80">
          <CardHeader className="pb-2">
            <CardDescription>{t("kpis.activeOrders")}</CardDescription>
            <CardTitle className="text-2xl">
              {data.totals.activeOrders}
            </CardTitle>
          </CardHeader>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        {data.organizations.map((organization) => (
          <Card key={organization.id} className="border-border/70 bg-card/80">
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <TbBuildingSkyscraper
                      className="size-5 text-primary"
                      aria-hidden
                    />
                    {organization.name}
                  </CardTitle>
                  <CardDescription className="mt-2">
                    {t("role", { role: organization.roleName })}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground">
                    {t("metrics.restaurants")}
                  </p>
                  <p className="mt-1 text-lg font-semibold">
                    {organization.restaurantCount}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">
                    {t("metrics.customers")}
                  </p>
                  <p className="mt-1 text-lg font-semibold">
                    {organization.customerCount}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">
                    {t("metrics.todayRevenue")}
                  </p>
                  <p className="mt-1 text-lg font-semibold">
                    {organization.todayRevenue}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <TbChefHat className="size-4" aria-hidden />
                  {t("metrics.activeOrders", {
                    count: organization.activeOrders,
                  })}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <TbUsers className="size-4" aria-hidden />
                  {t("metrics.customersShort", {
                    count: organization.customerCount,
                  })}
                </span>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">{t("restaurantsTitle")}</p>
                {organization.restaurants.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    {t("noRestaurants")}
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {organization.restaurants.map((restaurant) => (
                      <li key={restaurant.id}>
                        <Button
                          type="button"
                          variant="outline"
                          className="h-auto w-full justify-start gap-3 px-3 py-2.5"
                          disabled={switchRestaurantMutation.isPending}
                          onClick={() => handleSelectRestaurant(restaurant.id)}
                        >
                          <TbBuildingStore
                            className="size-4 shrink-0"
                            aria-hidden
                          />
                          <span className="min-w-0 text-left">
                            <span className="block truncate font-medium">
                              {restaurant.name}
                            </span>
                            {restaurant.city ? (
                              <span className="block truncate text-xs text-muted-foreground">
                                {restaurant.city}
                              </span>
                            ) : null}
                          </span>
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </section>

      <div>
        <Button variant="ghost" asChild>
          <Link href="/dashboard">{t("backToDashboard")}</Link>
        </Button>
      </div>
    </main>
  );
}
