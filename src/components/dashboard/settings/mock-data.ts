import type { SettingsMockData } from "./types";

type BuildMockDataInput = {
  restaurantName: string;
  timezone: string;
  currency: string;
};

export function buildSettingsMockData({
  restaurantName,
  timezone,
  currency,
}: BuildMockDataInput): SettingsMockData {
  return {
    profile: {
      name: restaurantName || "Bocao Kitchen",
      businessType: "restaurant",
      email: "hola@bocaokitchen.cl",
      phone: "+56 9 8765 4321",
      address: "Av. Providencia 1234",
      city: "Santiago",
      country: "Chile",
      countryCode: "CL",
      timezone,
      currency,
    },
    hours: {
      acceptOrders: true,
      acceptReservations: true,
      averagePrepMinutes: 22,
      tableCapacity: 48,
      closedMessage:
        "Estamos cerrados por ahora. Puedes ver el menú y volver en nuestro horario de atención.",
      weeklySchedule: [
        { dayKey: "monday", open: "12:00", close: "23:00", closed: false },
        { dayKey: "tuesday", open: "12:00", close: "23:00", closed: false },
        { dayKey: "wednesday", open: "12:00", close: "23:00", closed: false },
        { dayKey: "thursday", open: "12:00", close: "00:00", closed: false },
        { dayKey: "friday", open: "12:00", close: "01:00", closed: false },
        { dayKey: "saturday", open: "13:00", close: "01:00", closed: false },
        { dayKey: "sunday", open: "13:00", close: "22:00", closed: false },
      ],
    },
    whatsapp: {
      status: "connected",
      phoneNumber: "+56 9 8765 4321",
      autoReply: true,
      humanApproval: false,
      tone: "friendly",
      instructions:
        "Eres el asistente de Bocao Kitchen. Responde de forma cálida, confirma reservas y deriva pedidos complejos al equipo humano.",
    },
    team: [
      {
        id: "1",
        name: "Camila Rojas",
        email: "camila@bocaokitchen.cl",
        role: "owner",
        status: "active",
      },
      {
        id: "2",
        name: "Diego Morales",
        email: "diego@bocaokitchen.cl",
        role: "manager",
        status: "active",
      },
      {
        id: "3",
        name: "Valentina Soto",
        email: "valentina@bocaokitchen.cl",
        role: "staff",
        status: "pending",
      },
    ],
    billing: {
      plan: "growth",
      usage: {
        whatsappMessages: { used: 1840, limit: 3000 },
        aiCredits: { used: 420, limit: 1000 },
        reservations: { used: 186, limit: 500 },
      },
    },
    appearance: {
      brandColor: "#E85D3B",
    },
    security: {
      twoFactorEnabled: false,
      activeSessions: 3,
    },
  };
}
