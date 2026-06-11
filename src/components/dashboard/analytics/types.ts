import type {
  AnalyticsChannel,
  AnalyticsDatePreset,
  AnalyticsOrderStatus,
} from "@/lib/analytics/types";

export type AnalyticsLabels = {
  header: {
    title: string;
    subtitle: string;
  };
  actions: {
    exportCsv: string;
    exportSuccess: string;
    clearFilters: string;
    refresh: string;
  };
  filters: {
    restaurant: string;
    dateRange: string;
    channel: string;
    status: string;
    from: string;
    to: string;
    all: string;
    presets: Record<AnalyticsDatePreset, string>;
    activeCount: string;
    noActive: string;
  };
  channels: Record<AnalyticsChannel | "all", string>;
  statuses: Record<AnalyticsOrderStatus, string>;
  kpis: {
    totalRevenue: string;
    orders: string;
    averageTicket: string;
    uniqueCustomers: string;
    cancellationRate: string;
    averagePreparationTime: string;
    vsPrevious: string;
    notAvailable: string;
    minutesShort: string;
  };
  charts: {
    revenueOverTime: string;
    ordersOverTime: string;
    ordersByChannel: string;
    topProducts: string;
    peakHours: string;
    kitchenPerformance: string;
    customerInsights: string;
    aiInsights: string;
    revenue: string;
    orders: string;
    hour: string;
    product: string;
    quantity: string;
    share: string;
  };
  customerInsights: {
    uniqueCustomers: string;
    customersWithOrders: string;
    reservations: string;
  };
  kitchen: {
    averagePreparation: string;
    delayedOrders: string;
    busiestStation: string;
    stationStats: string;
    emptyTitle: string;
    emptyDescription: string;
    todoStations: string;
  };
  table: {
    product: string;
    quantity: string;
    revenue: string;
    share: string;
  };
  empty: {
    title: string;
    description: string;
  };
  permissions: {
    deniedTitle: string;
    deniedDescription: string;
  };
};

export type AnalyticsRestaurantOption = {
  id: string;
  name: string;
};
