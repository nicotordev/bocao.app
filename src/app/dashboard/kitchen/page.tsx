import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getTranslations } from "next-intl/server";
import { KitchenPageClient } from "@/components/dashboard/kitchen/kitchen-page-client";
import type { KitchenLabels } from "@/components/dashboard/kitchen/types";
import { getDashboardContext } from "@/lib/dashboard/context";
import { getQueryClient } from "@/lib/query/get-query-client";
import { kitchenOrdersQueryOptions } from "@/lib/query/kitchen/kitchen.queries";

export default async function KitchenPage() {
  const t = await getTranslations("dashboard.kitchen");
  const tCommon = await getTranslations("common");
  const context = await getDashboardContext();
  const restaurantId = context?.activeRestaurant?.id ?? "";
  const queryClient = getQueryClient();

  if (restaurantId) {
    await queryClient.prefetchQuery(kitchenOrdersQueryOptions(restaurantId));
  }

  const labels: KitchenLabels = {
    actions: {
      refresh: t("actions.refresh"),
      configureStations: t("actions.configureStations"),
      fullscreen: t("actions.fullscreen"),
      exitFullscreen: t("actions.exitFullscreen"),
      start: t("actions.start"),
      pause: t("actions.pause"),
      resume: t("actions.resume"),
      markReady: t("actions.markReady"),
      markDelivered: t("actions.markDelivered"),
      viewDetail: t("actions.viewDetail"),
      changeStatus: t("actions.changeStatus"),
      reassignStation: t("actions.reassignStation"),
      markDelayed: t("actions.markDelayed"),
      printTicket: t("actions.printTicket"),
      viewSuggestions: t("actions.viewSuggestions"),
      clearFilters: t("actions.clearFilters"),
      toggleFilters: t("actions.toggleFilters"),
    },
    header: {
      title: t("header.title"),
      subtitle: t("header.subtitle"),
    },
    kpis: {
      active: t("kpis.active"),
      averageTime: t("kpis.averageTime"),
      delayed: t("kpis.delayed"),
      ready: t("kpis.ready"),
      notAvailable: tCommon("notAvailable"),
      preparingCount: t.raw("kpis.preparingCount"),
      delayedAttention: t.raw("kpis.delayedAttention"),
    },
    toolbar: {
      search: t("toolbar.search"),
      searchPlaceholder: t("toolbar.searchPlaceholder"),
      station: t("toolbar.station"),
      priority: t("toolbar.priority"),
      channel: t("toolbar.channel"),
      view: t("toolbar.view"),
      all: t("toolbar.all"),
    },
    stations: {
      all: t("stationTypes.all"),
      grill: t("stationTypes.grill"),
      fryer: t("stationTypes.fryer"),
      sushi: t("stationTypes.sushi"),
      bar: t("stationTypes.bar"),
      desserts: t("stationTypes.desserts"),
      delivery_station: t("stationTypes.delivery"),
    },
    priorities: {
      all: t("priorities.all"),
      normal: t("priorities.normal"),
      high: t("priorities.high"),
      urgent: t("priorities.urgent"),
      delayed: t("priorities.delayed"),
    },
    channels: {
      all: t("channels.all"),
      whatsapp: t("channels.whatsapp"),
      web: t("channels.web"),
      table: t("channels.table"),
      delivery: t("channels.delivery"),
      pickup: t("channels.pickup"),
    },
    statuses: {
      received: t("statuses.received"),
      in_preparation: t("statuses.inPreparation"),
      waiting: t("statuses.waiting"),
      ready: t("statuses.ready"),
      delivered: t("statuses.delivered"),
      deliveredLate: t("statuses.deliveredLate"),
      delayed: t("statuses.delayed"),
    },
    views: {
      cards: t("views.cards"),
      kanban: t("views.kanban"),
      timeline: t("views.timeline"),
    },
    tabs: {
      cards: t("tabs.cards"),
      kanban: t("tabs.kanban"),
      timeline: t("tabs.timeline"),
    },
    ticket: {
      table: t("ticket.table"),
      minutes: t("ticket.minutes"),
      paused: t("ticket.paused"),
      items: t("ticket.items"),
      noItems: t("ticket.noItems"),
      moreItems: t.raw("ticket.moreItems"),
      kitchenNote: t("ticket.kitchenNote"),
      importantNote: t("ticket.importantNote"),
      allergen: t("ticket.allergen"),
      delayedAlert: t("ticket.delayedAlert"),
    },
    kanban: {
      dragHelp: t("kanban.dragHelp"),
      dropHere: t("kanban.dropHere"),
    },
    timeline: {
      title: t("timeline.title"),
      subtitle: t("timeline.subtitle"),
      eventReceived: t("timeline.eventReceived"),
      eventAssigned: t("timeline.eventAssigned"),
      eventStarted: t("timeline.eventStarted"),
      eventPaused: t("timeline.eventPaused"),
      eventReady: t("timeline.eventReady"),
      eventDelivered: t("timeline.eventDelivered"),
      eventDelayed: t("timeline.eventDelayed"),
      fromChannel: t("timeline.fromChannel"),
    },
    drawer: {
      title: t("drawer.title"),
      description: t("drawer.description"),
      order: t("drawer.order"),
      items: t("drawer.items"),
      operation: t("drawer.operation"),
      timeline: t("drawer.timeline"),
      actions: t("drawer.actions"),
      number: t("drawer.number"),
      status: t("drawer.status"),
      channel: t("drawer.channel"),
      destination: t("drawer.destination"),
      receivedAt: t("drawer.receivedAt"),
      totalTime: t("drawer.totalTime"),
      station: t("drawer.station"),
      assignee: t("drawer.assignee"),
      priority: t("drawer.priority"),
      sla: t("drawer.sla"),
      quantity: t("drawer.quantity"),
      modifiers: t("drawer.modifiers"),
      allergens: t("drawer.allergens"),
      notes: t("drawer.notes"),
    },
    copilot: {
      title: t("copilot.title"),
      subtitle: t("copilot.subtitle"),
    },
    empty: {
      title: t("empty.title"),
      description: t("empty.description"),
      cta: t("empty.cta"),
    },
    loading: {
      tickets: t("loading.tickets"),
    },
    accessibility: {
      openDetails: t("accessibility.openDetails"),
      orderNumber: t("accessibility.orderNumber"),
    },
  };

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <KitchenPageClient
        labels={labels}
        insightLabels={{
          delayedSla: t.raw("copilot.insights.delayedSla"),
          averagePrep: t.raw("copilot.insights.averagePrep"),
          busiestStation: t.raw("copilot.insights.busiestStation"),
        }}
        restaurantId={restaurantId}
      />
    </HydrationBoundary>
  );
}
