export type {
  DashboardOrder,
  Order,
  OrderChannel,
  OrderItem,
  OrderStatus,
  OrderTimelineEvent,
} from "@/lib/orders/types";

export type OrdersLabels = {
  actions: {
    newOrder: string;
    export: string;
    exportSuccess: string;
    exportEmpty: string;
    refresh: string;
    viewDetail: string;
    edit: string;
    print: string;
    duplicate: string;
    changeStatus: string;
    cancel: string;
    clearFilters: string;
  };
  header: {
    title: string;
    subtitle: string;
  };
  filters: {
    search: string;
    searchPlaceholder: string;
    status: string;
    channel: string;
    date: string;
    restaurant: string;
    from: string;
    to: string;
    all: string;
    menu: string;
    activeCount: string;
    noActive: string;
  };
  statuses: Record<import("@/lib/orders/types").OrderStatus | "all", string>;
  channels: Record<import("@/lib/orders/types").OrderChannel | "all", string>;
  tabs: {
    orders: string;
    kanban: string;
    timeline: string;
  };
  table: {
    id: string;
    customer: string;
    channel: string;
    status: string;
    total: string;
    time: string;
    wait: string;
    owner: string;
    actions: string;
    minutes: string;
    tableNumber: string;
  };
  kpis: {
    active: string;
    preparing: string;
    ready: string;
    sales: string;
    activeTrend: string;
    preparingTrend: string;
    readyTrend: string;
    salesTrend: string;
  };
  kanban: {
    dragHelp: string;
    dropHere: string;
    guideTitle: string;
    guideDescription: string;
    guideDismiss: string;
    guidePhantomId: string;
    guidePhantomCustomer: string;
    guidePhantomTotal: string;
    guidePhantomOwner: string;
  };
  timeline: {
    title: string;
    subtitle: string;
    eventReceived: string;
    eventConfirmedAi: string;
    eventPreparing: string;
    eventReady: string;
    eventDelivered: string;
  };
  drawer: {
    title: string;
    description: string;
    general: string;
    customer: string;
    products: string;
    summary: string;
    timeline: string;
    notes: string;
    number: string;
    date: string;
    phone: string;
    history: string;
    subtotal: string;
    taxes: string;
    total: string;
  };
  insights: {
    title: string;
    subtitle: string;
    items: string[];
  };
  empty: {
    title: string;
    description: string;
    cta: string;
  };
  accessibility: {
    openActions: string;
    openDetails: string;
    whatsappOrder: string;
  };
};
