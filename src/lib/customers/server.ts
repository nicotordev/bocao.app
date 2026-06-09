import { getLocale } from "next-intl/server";
import type { CustomersListFilters } from "@/lib/customers/filters";
import { listCustomersPage } from "@/lib/customers/repository";
import type { CustomersPageData } from "@/lib/customers/types";
import type { DashboardContext } from "@/lib/dashboard/types";

export async function loadCustomersPageData(
  restaurantId: string,
  filters: CustomersListFilters,
  context: DashboardContext,
): Promise<CustomersPageData> {
  const locale = await getLocale();
  const restaurant =
    context.restaurants.find((entry) => entry.id === restaurantId) ??
    context.activeRestaurant;

  const data = await listCustomersPage(restaurantId, filters, {
    currency: restaurant?.currency ?? "CLP",
    timezone: restaurant?.timezone ?? "America/Santiago",
    locale,
    neverLabel: locale === "es" ? "Sin visitas" : "No visits yet",
    notAvailableLabel:
      locale === "es" ? "Sin datos comparativos" : "No comparison data",
  });

  return {
    ...data,
    restaurantId,
    currency: restaurant?.currency ?? "CLP",
    updatedAt: new Date().toISOString(),
  };
}
