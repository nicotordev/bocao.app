import { getTranslations } from "next-intl/server";
import {
  RecentOrdersListClient,
  type RecentOrdersListLabels,
} from "@/components/dashboard/recent-orders-list-client";
import type { DashboardOrderPreview } from "@/lib/dashboard/data";
import type { OrdersLabels } from "@/components/dashboard/orders/types";

type RecentOrdersListProps = {
  orders: DashboardOrderPreview[];
};

export async function RecentOrdersList({ orders }: RecentOrdersListProps) {
  const t = await getTranslations("dashboard.home.recentOrders");
  const tOrders = await getTranslations("dashboard.orders");

  const labels: RecentOrdersListLabels = {
    title: t("title"),
    description: t("description"),
    viewAll: t("viewAll"),
    viewDetail: t("viewDetail"),
    viewOrder: t.raw("viewOrder"),
    table: t.raw("table"),
    statuses: {
      draft: tOrders("statuses.draft"),
      received: tOrders("statuses.received"),
      confirmed: tOrders("statuses.confirmed"),
      preparing: tOrders("statuses.preparing"),
      ready: tOrders("statuses.ready"),
      delivered: tOrders("statuses.delivered"),
      cancelled: tOrders("statuses.cancelled"),
      all: tOrders("statuses.all"),
    } satisfies OrdersLabels["statuses"],
    channels: {
      whatsapp: tOrders("channels.whatsapp"),
      web: tOrders("channels.web"),
      dineIn: tOrders("channels.dineIn"),
      uberEats: tOrders("channels.uberEats"),
      rappi: tOrders("channels.rappi"),
      pos: tOrders("channels.pos"),
      all: tOrders("channels.all"),
    } satisfies OrdersLabels["channels"],
    whatsappOrder: tOrders("accessibility.whatsappOrder"),
    empty: {
      title: t("empty.title"),
      description: t("empty.description"),
    },
  };

  return <RecentOrdersListClient orders={orders} labels={labels} />;
}
