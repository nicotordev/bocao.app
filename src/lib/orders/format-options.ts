import { getLocale, getTranslations } from "next-intl/server";
import type { OrderCustomerLabels } from "@/lib/orders/order-customers";

export type OrderFormatOptions = {
  locale?: string;
  customerLabels?: OrderCustomerLabels;
};

export type CreateOrderLabels = {
  manualOrderHistory: string;
  timelineNow: string;
};

export async function getOrderFormatOptions(): Promise<OrderFormatOptions> {
  const locale = await getLocale();
  const t = await getTranslations("dashboard.orders.drawer");

  return {
    locale,
    customerLabels: {
      fallbackCustomer: t("fallbackCustomer"),
      tableOnly: t.raw("tableOnly"),
      tableWithCustomers: t.raw("tableWithCustomers"),
    },
  };
}

export async function getCreateOrderLabels(): Promise<CreateOrderLabels> {
  const tDrawer = await getTranslations("dashboard.orders.drawer");
  const tTimeline = await getTranslations("dashboard.orders.timeline");

  return {
    manualOrderHistory: tDrawer("manualOrderHistory"),
    timelineNow: tTimeline("now"),
  };
}
