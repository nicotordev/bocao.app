import { getLocale } from "next-intl/server";
import type { CustomersListFilters } from "@/lib/customers/filters";
import {
  getCustomerDetail,
  listCustomersPage,
} from "@/lib/customers/repository";
import type { CustomersPageData } from "@/lib/customers/types";
import type { DashboardContext } from "@/lib/dashboard/types";

function resolveCustomerFormatOptions(
  context: DashboardContext,
  restaurantId: string,
  locale: string,
) {
  const restaurant =
    context.restaurants.find((entry) => entry.id === restaurantId) ??
    context.activeRestaurant;

  return {
    currency: restaurant?.currency ?? "CLP",
    timezone: restaurant?.timezone ?? "America/Santiago",
    locale,
    neverLabel: locale === "es" ? "Sin visitas" : "No visits yet",
    notAvailableLabel:
      locale === "es" ? "Sin datos comparativos" : "No comparison data",
  };
}

export async function loadCustomersPageData(
  restaurantId: string,
  filters: CustomersListFilters,
  context: DashboardContext,
): Promise<CustomersPageData> {
  const locale = await getLocale();
  const formatOptions = resolveCustomerFormatOptions(
    context,
    restaurantId,
    locale,
  );

  const data = await listCustomersPage(restaurantId, filters, formatOptions);

  return {
    ...data,
    restaurantId,
    currency: formatOptions.currency,
    updatedAt: new Date().toISOString(),
  };
}

export async function loadCustomerDetail(
  restaurantId: string,
  customerId: string,
  context: DashboardContext,
) {
  const locale = await getLocale();
  const formatOptions = resolveCustomerFormatOptions(
    context,
    restaurantId,
    locale,
  );

  const customer = await getCustomerDetail(
    restaurantId,
    customerId,
    formatOptions,
  );

  if (!customer) {
    throw new Error("CUSTOMER_NOT_FOUND");
  }

  return customer;
}
