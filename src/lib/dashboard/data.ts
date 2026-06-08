export type DashboardMetric = {
  id: string;
  label: string;
  value: string;
  change: string;
  trend: "up" | "down" | "neutral";
};

export type DashboardOrderPreview = {
  id: string;
  orderNumber: string;
  customerName: string;
  status: "pending" | "preparing" | "ready" | "completed";
  total: string;
  createdAt: string;
};

export type DashboardReservationPreview = {
  id: string;
  guestName: string;
  guestCount: number;
  scheduledAt: string;
  status: "confirmed" | "pending" | "seated";
};

export type DashboardInsight = {
  id: string;
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
};

export type DashboardTeamMember = {
  id: string;
  name: string;
  role: string;
  status: "online" | "busy" | "offline";
};

export type DashboardHomeData = {
  metrics: DashboardMetric[];
  recentOrders: DashboardOrderPreview[];
  upcomingReservations: DashboardReservationPreview[];
  insights: DashboardInsight[];
  whatsapp: {
    connected: boolean;
    unreadCount: number;
    lastMessageAt: string;
    responseRate: string;
  };
  teamActivity: DashboardTeamMember[];
};
