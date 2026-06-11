import type { OrderChannel, OrderStatus } from "@/lib/orders/types";
import type { ReservationStatus } from "@/lib/reservations/types";

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
  status: OrderStatus;
  channel: OrderChannel;
  tableNumber?: string;
  total: string;
  createdAt: string;
};

export type DashboardReservationPreview = {
  id: string;
  guestName: string;
  guestPhoto: string;
  guestCount: number;
  scheduledAt: string;
  status: ReservationStatus;
  guestPhone?: string;
  guestEmail?: string;
  guestNotes?: string;
  customerId?: string;
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
