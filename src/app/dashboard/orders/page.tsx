import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getTranslations } from "next-intl/server";
import { OrdersPageClient } from "@/components/dashboard/orders/orders-page-client";
import type { OrdersLabels } from "@/components/dashboard/orders/types";
import { getDashboardContext } from "@/lib/dashboard/context";
import { getQueryClient } from "@/lib/query/get-query-client";
import { ordersListQueryOptions } from "@/lib/query/orders/orders.queries";

export default async function OrdersPage() {
  const t = await getTranslations("dashboard.orders");
  const context = await getDashboardContext();
  const restaurantId = context?.activeRestaurant?.id ?? "";
  const queryClient = getQueryClient();

  if (restaurantId) {
    await queryClient.prefetchQuery(ordersListQueryOptions(restaurantId));
  }

  const labels: OrdersLabels = {
    actions: {
      newOrder: t("actions.newOrder"),
      export: t("actions.export"),
      refresh: t("actions.refresh"),
      viewDetail: t("actions.viewDetail"),
      edit: t("actions.edit"),
      print: t("actions.print"),
      duplicate: t("actions.duplicate"),
      changeStatus: t("actions.changeStatus"),
      cancel: t("actions.cancel"),
      clearFilters: t("actions.clearFilters"),
    },
    header: {
      title: t("header.title"),
      subtitle: t("header.subtitle"),
    },
    filters: {
      search: t("filters.search"),
      searchPlaceholder: t("filters.searchPlaceholder"),
      status: t("filters.status"),
      channel: t("filters.channel"),
      date: t("filters.date"),
      restaurant: t("filters.restaurant"),
      from: t("filters.from"),
      to: t("filters.to"),
      all: t("filters.all"),
      menu: t("filters.menu"),
      activeCount: t.raw("filters.activeCount"),
      noActive: t("filters.noActive"),
    },
    statuses: {
      all: t("statuses.all"),
      received: t("statuses.received"),
      confirmed: t("statuses.confirmed"),
      preparing: t("statuses.preparing"),
      ready: t("statuses.ready"),
      delivered: t("statuses.delivered"),
      cancelled: t("statuses.cancelled"),
    },
    channels: {
      all: t("channels.all"),
      whatsapp: t("channels.whatsapp"),
      web: t("channels.web"),
      dineIn: t("channels.dineIn"),
      uberEats: t("channels.uberEats"),
      rappi: t("channels.rappi"),
    },
    tabs: {
      orders: t("tabs.orders"),
      kanban: t("tabs.kanban"),
      timeline: t("tabs.timeline"),
    },
    table: {
      id: t("table.id"),
      customer: t("table.customer"),
      channel: t("table.channel"),
      status: t("table.status"),
      total: t("table.total"),
      time: t("table.time"),
      wait: t("table.wait"),
      owner: t("table.owner"),
      actions: t("table.actions"),
      minutes: t("table.minutes"),
    },
    kpis: {
      active: t("kpis.active"),
      preparing: t("kpis.preparing"),
      ready: t("kpis.ready"),
      sales: t("kpis.sales"),
      activeTrend: t("kpis.activeTrend"),
      preparingTrend: t("kpis.preparingTrend"),
      readyTrend: t("kpis.readyTrend"),
      salesTrend: t("kpis.salesTrend"),
    },
    kanban: {
      dragHelp: t("kanban.dragHelp"),
      dropHere: t("kanban.dropHere"),
      guideTitle: t("kanban.guideTitle"),
      guideDescription: t("kanban.guideDescription"),
      guideDismiss: t("kanban.guideDismiss"),
      guidePhantomId: t("kanban.guidePhantomId"),
      guidePhantomCustomer: t("kanban.guidePhantomCustomer"),
      guidePhantomTotal: t("kanban.guidePhantomTotal"),
      guidePhantomOwner: t("kanban.guidePhantomOwner"),
    },
    timeline: {
      title: t("timeline.title"),
      subtitle: t("timeline.subtitle"),
      eventReceived: t("timeline.eventReceived"),
      eventConfirmedAi: t("timeline.eventConfirmedAi"),
      eventPreparing: t("timeline.eventPreparing"),
      eventReady: t("timeline.eventReady"),
      eventDelivered: t("timeline.eventDelivered"),
    },
    drawer: {
      title: t("drawer.title"),
      description: t("drawer.description"),
      general: t("drawer.general"),
      customer: t("drawer.customer"),
      products: t("drawer.products"),
      summary: t("drawer.summary"),
      timeline: t("drawer.timeline"),
      notes: t("drawer.notes"),
      number: t("drawer.number"),
      date: t("drawer.date"),
      phone: t("drawer.phone"),
      history: t("drawer.history"),
      subtotal: t("drawer.subtotal"),
      taxes: t("drawer.taxes"),
      total: t("drawer.total"),
    },
    insights: {
      title: t("insights.title"),
      subtitle: t("insights.subtitle"),
      items: [],
    },
    empty: {
      title: t("empty.title"),
      description: t("empty.description"),
      cta: t("empty.cta"),
    },
    accessibility: {
      openActions: t("accessibility.openActions"),
      openDetails: t("accessibility.openDetails"),
      whatsappOrder: t("accessibility.whatsappOrder"),
    },
  };

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <OrdersPageClient
        labels={labels}
        restaurantId={restaurantId}
        restaurants={
          context?.restaurants.map((restaurant) => restaurant.name) ?? []
        }
      />
    </HydrationBoundary>
  );
}
