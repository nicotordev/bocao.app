export type AnalyticsChannel =
  | "pos"
  | "whatsapp"
  | "web"
  | "delivery"
  | "manual";

export type AnalyticsOrderStatus =
  | "all"
  | "confirmed"
  | "completed"
  | "cancelled";

export type AnalyticsDatePreset =
  | "today"
  | "yesterday"
  | "last7days"
  | "last30days"
  | "thisMonth"
  | "lastMonth"
  | "custom";

export type AnalyticsDateRange = {
  from: Date;
  to: Date;
};

export type AnalyticsFilters = {
  restaurantId: string;
  organizationId: string;
  from: Date;
  to: Date;
  channel?: AnalyticsChannel | "all";
  status?: AnalyticsOrderStatus;
  timezone: string;
  currency: string;
  locale: string;
};

export type AnalyticsOverview = {
  totalRevenue: number;
  totalOrders: number;
  averageTicket: number;
  uniqueCustomers: number;
  cancellationRate: number;
  averagePreparationMinutes: number | null;
  revenueChangePercent: number | null;
  ordersChangePercent: number | null;
};

export type RevenuePoint = {
  date: string;
  revenue: number;
  orders: number;
};

export type ChannelBreakdown = {
  channel: AnalyticsChannel;
  orders: number;
  revenue: number;
};

export type TopProduct = {
  productId: string | null;
  name: string;
  quantity: number;
  revenue: number;
  sharePercent: number;
};

export type PeakHour = {
  hour: number;
  orders: number;
  revenue: number;
  averageTicket: number;
};

export type KitchenStationStat = {
  station: string;
  averageMinutes: number;
  orderCount: number;
};

export type KitchenPerformance = {
  averagePreparationMinutes: number | null;
  delayedOrders: number;
  busiestStation: string | null;
  stationStats: KitchenStationStat[];
};

export type CustomerInsights = {
  uniqueCustomers: number;
  reservationCount: number;
  customersWithOrders: number;
};

export type AnalyticsInsight = {
  id: string;
  message: string;
};

export type AnalyticsDashboardData = {
  overview: AnalyticsOverview;
  revenueSeries: RevenuePoint[];
  channelBreakdown: ChannelBreakdown[];
  topProducts: TopProduct[];
  peakHours: PeakHour[];
  kitchenPerformance: KitchenPerformance | null;
  customerInsights: CustomerInsights;
  insights: AnalyticsInsight[];
  filters: {
    from: string;
    to: string;
    channel: AnalyticsChannel | "all";
    status: AnalyticsOrderStatus;
  };
  updatedAt: string;
};
