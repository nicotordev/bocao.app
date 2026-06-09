import type {
  KitchenChannel,
  KitchenKanbanStatus,
  KitchenOrder,
  KitchenOrderStatus,
  KitchenPriority,
  KitchenStation,
  KitchenTimelineEvent,
  KitchenViewMode,
} from "@/lib/kitchen/types";

export type KitchenLabels = {
  actions: {
    refresh: string;
    configureStations: string;
    fullscreen: string;
    exitFullscreen: string;
    start: string;
    pause: string;
    resume: string;
    markReady: string;
    markDelivered: string;
    viewDetail: string;
    changeStatus: string;
    reassignStation: string;
    markDelayed: string;
    printTicket: string;
    viewSuggestions: string;
    clearFilters: string;
    toggleFilters: string;
  };
  header: {
    title: string;
    subtitle: string;
  };
  kpis: {
    active: string;
    averageTime: string;
    delayed: string;
    ready: string;
    notAvailable: string;
    preparingCount: string;
    delayedAttention: string;
  };
  toolbar: {
    search: string;
    searchPlaceholder: string;
    station: string;
    priority: string;
    channel: string;
    view: string;
    all: string;
  };
  stations: Record<KitchenStation | "all", string>;
  priorities: Record<KitchenPriority | "all", string>;
  channels: Record<KitchenChannel | "all", string>;
  statuses: Record<KitchenOrderStatus, string> & {
    deliveredLate: string;
  };
  views: Record<KitchenViewMode, string>;
  tabs: {
    cards: string;
    kanban: string;
    timeline: string;
  };
  ticket: {
    table: string;
    minutes: string;
    paused: string;
    items: string;
    noItems: string;
    moreItems: string;
    kitchenNote: string;
    importantNote: string;
    allergen: string;
    delayedAlert: string;
  };
  kanban: {
    dragHelp: string;
    dropHere: string;
  };
  timeline: {
    title: string;
    subtitle: string;
    eventReceived: string;
    eventAssigned: string;
    eventStarted: string;
    eventPaused: string;
    eventReady: string;
    eventDelivered: string;
    eventDelayed: string;
    fromChannel: string;
  };
  drawer: {
    title: string;
    description: string;
    order: string;
    items: string;
    operation: string;
    timeline: string;
    actions: string;
    number: string;
    status: string;
    channel: string;
    destination: string;
    receivedAt: string;
    totalTime: string;
    station: string;
    assignee: string;
    priority: string;
    sla: string;
    quantity: string;
    modifiers: string;
    allergens: string;
    notes: string;
  };
  copilot: {
    title: string;
    subtitle: string;
    emptyTitle: string;
    emptyDescription: string;
    footerHint: string;
  };
  empty: {
    title: string;
    description: string;
    cta: string;
  };
  loading: {
    tickets: string;
  };
  accessibility: {
    openDetails: string;
    orderNumber: string;
  };
};

export type { KitchenOrder, KitchenKanbanStatus, KitchenTimelineEvent };
