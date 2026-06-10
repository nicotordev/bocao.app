import { getLocale } from "next-intl/server";
import { NewOrderPageClient } from "@/components/dashboard/orders/new/new-order-page-client";
import { getDashboardContext } from "@/lib/dashboard/context";
import { getNewOrderPageData } from "@/lib/orders/new-order-page-data";

type NewOrderPageProps = {
  searchParams: Promise<{
    table?: string;
  }>;
};

export default async function NewOrderPage({
  searchParams,
}: NewOrderPageProps) {
  const params = await searchParams;
  const uiLocale = await getLocale();
  const context = await getDashboardContext();
  const restaurantId = context?.activeRestaurant?.id ?? "";
  const currency = context?.activeRestaurant?.currency ?? "CLP";
  const permissions = context?.membership.permissions ?? [];

  const newOrderData = await getNewOrderPageData({
    restaurantId,
    currency,
    permissions,
    uiLocale,
    initialTableNumber: params.table?.trim(),
  });

  return <NewOrderPageClient {...newOrderData} />;
}
