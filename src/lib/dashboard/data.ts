import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { DashboardRestaurant } from "@/lib/dashboard/types";

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

function formatCurrency(amountCents: number, currency: string): string {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amountCents / 100);
}

export function getDashboardHomeData(
  restaurant: DashboardRestaurant | null,
): DashboardHomeData {
  const currency = restaurant?.currency ?? "CLP";
  const restaurantName = restaurant?.name ?? "tu restaurante";

  return {
    metrics: [
      {
        id: "revenue-today",
        label: "Ingresos de hoy",
        value: formatCurrency(1842500, currency),
        change: "+12.4% vs ayer",
        trend: "up",
      },
      {
        id: "open-orders",
        label: "Pedidos abiertos",
        value: "14",
        change: "6 en cocina",
        trend: "neutral",
      },
      {
        id: "upcoming-reservations",
        label: "Reservas próximas",
        value: "23",
        change: "8 en las próximas 3h",
        trend: "up",
      },
      {
        id: "avg-prep-time",
        label: "Tiempo promedio de preparación",
        value: "18 min",
        change: "-2 min vs semana pasada",
        trend: "up",
      },
    ],
    recentOrders: [
      {
        id: "ord-1",
        orderNumber: "#1042",
        customerName: "María González",
        status: "preparing",
        total: formatCurrency(28900, currency),
        createdAt: "Hace 8 min",
      },
      {
        id: "ord-2",
        orderNumber: "#1041",
        customerName: "Carlos Ruiz",
        status: "ready",
        total: formatCurrency(45200, currency),
        createdAt: "Hace 15 min",
      },
      {
        id: "ord-3",
        orderNumber: "#1040",
        customerName: "Ana Martínez",
        status: "pending",
        total: formatCurrency(18750, currency),
        createdAt: "Hace 22 min",
      },
      {
        id: "ord-4",
        orderNumber: "#1039",
        customerName: "Pedro Soto",
        status: "completed",
        total: formatCurrency(62400, currency),
        createdAt: "Hace 35 min",
      },
    ],
    upcomingReservations: [
      {
        id: "res-1",
        guestName: "Familia Herrera",
        guestCount: 4,
        scheduledAt: format(new Date(Date.now() + 45 * 60_000), "HH:mm", {
          locale: es,
        }),
        status: "confirmed",
      },
      {
        id: "res-2",
        guestName: "Lucía Fernández",
        guestCount: 2,
        scheduledAt: format(new Date(Date.now() + 90 * 60_000), "HH:mm", {
          locale: es,
        }),
        status: "pending",
      },
      {
        id: "res-3",
        guestName: "Grupo Empresarial Delta",
        guestCount: 8,
        scheduledAt: format(new Date(Date.now() + 150 * 60_000), "HH:mm", {
          locale: es,
        }),
        status: "confirmed",
      },
    ],
    insights: [
      {
        id: "insight-1",
        title: "Pico de demanda detectado",
        description: `Entre 20:00 y 21:30 se proyecta un aumento del 28% en pedidos para ${restaurantName}. Considera reforzar cocina.`,
        priority: "high",
      },
      {
        id: "insight-2",
        title: "Oportunidad de upsell",
        description:
          "El 34% de clientes que piden hamburguesas aceptan postre cuando se ofrece por WhatsApp.",
        priority: "medium",
      },
      {
        id: "insight-3",
        title: "Menú con baja rotación",
        description:
          "3 platos no se han vendido en 7 días. La IA sugiere un combo promocional.",
        priority: "low",
      },
    ],
    whatsapp: {
      connected: true,
      unreadCount: 7,
      lastMessageAt: "Hace 3 min",
      responseRate: "94%",
    },
    teamActivity: [
      {
        id: "team-1",
        name: "Valentina",
        role: "Cocina",
        status: "busy",
      },
      {
        id: "team-2",
        name: "Diego",
        role: "Salón",
        status: "online",
      },
      {
        id: "team-3",
        name: "Camila",
        role: "WhatsApp",
        status: "online",
      },
      {
        id: "team-4",
        name: "Andrés",
        role: "Manager",
        status: "offline",
      },
    ],
  };
}
