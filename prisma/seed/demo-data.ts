export const DEMO_RESTAURANTS = [
  {
    slug: "providencia",
    name: "Bocao Providencia",
    city: "Providencia",
    currency: "CLP",
    timezone: "America/Santiago",
  },
  {
    slug: "vitacura",
    name: "Bocao Vitacura",
    city: "Vitacura",
    currency: "CLP",
    timezone: "America/Santiago",
  },
] as const;

export type DemoOrderSeed = {
  orderNumber: string;
  customerName: string;
  additionalCustomerNames?: string[];
  phone: string;
  tableNumber?: string;
  channel: string;
  status:
    | "PENDING"
    | "CONFIRMED"
    | "PREPARING"
    | "READY"
    | "COMPLETED"
    | "CANCELLED";
  totalCents: number;
  minutesAgo: number;
  preparationMins: number;
  assignedTo: string;
  notes: string;
  details: {
    history: string;
    items: Array<{ name: string; quantity: number; price: string }>;
    summary: { subtotal: string; taxes: string; total: string };
    timeline: Array<{ time: string; titleKey: string; actor?: string }>;
  };
};

export const DEMO_ORDERS: DemoOrderSeed[] = [
  {
    orderNumber: "#1042",
    customerName: "Valentina Rojas",
    phone: "+56 9 8421 3344",
    channel: "whatsapp",
    status: "PREPARING",
    totalCents: 42900,
    minutesAgo: 24,
    preparationMins: 24,
    assignedTo: "Camila",
    notes: "Sin cebolla. Confirmar despacho por WhatsApp antes de salir.",
    details: {
      history: "14 pedidos previos · ticket alto",
      items: [
        { name: "Bocao Burger", quantity: 2, price: "$25.800" },
        { name: "Papas rusticas", quantity: 1, price: "$6.900" },
        { name: "Limonada menta", quantity: 2, price: "$10.200" },
      ],
      summary: {
        subtotal: "$36.050",
        taxes: "$6.850",
        total: "$42.900",
      },
      timeline: [
        { time: "10:01", titleKey: "eventReceived" },
        { time: "10:03", titleKey: "eventConfirmedAi", actor: "Bocao AI" },
        { time: "10:07", titleKey: "eventPreparing", actor: "Camila" },
      ],
    },
  },
  {
    orderNumber: "#1041",
    customerName: "Diego Fuentes",
    phone: "+56 9 1122 9081",
    channel: "web",
    status: "READY",
    totalCents: 28500,
    minutesAgo: 31,
    preparationMins: 31,
    assignedTo: "Nicolas",
    notes: "Cliente espera en barra.",
    details: {
      history: "Primera compra · retiro en local",
      items: [
        { name: "Ensalada Cesar", quantity: 1, price: "$12.900" },
        { name: "Wrap pollo grill", quantity: 1, price: "$15.600" },
      ],
      summary: {
        subtotal: "$23.950",
        taxes: "$4.550",
        total: "$28.500",
      },
      timeline: [
        { time: "09:54", titleKey: "eventReceived" },
        { time: "09:56", titleKey: "eventConfirmedAi", actor: "Bocao AI" },
        { time: "10:02", titleKey: "eventPreparing", actor: "Nicolas" },
        { time: "10:19", titleKey: "eventReady", actor: "Cocina" },
      ],
    },
  },
  {
    orderNumber: "#1040",
    customerName: "Valentina Rojas",
    additionalCustomerNames: ["Diego Fuentes", "Camila Morales", "Nicolas Soto"],
    phone: "+56 9 8421 3344",
    tableNumber: "12",
    channel: "dineIn",
    status: "CONFIRMED",
    totalCents: 64200,
    minutesAgo: 38,
    preparationMins: 11,
    assignedTo: "Sofia",
    notes: "Enviar postres cuando cocina libere comanda principal.",
    details: {
      history: "Servicio en salon · 4 personas",
      items: [
        { name: "Tabla para compartir", quantity: 1, price: "$32.900" },
        { name: "Pisco sour", quantity: 4, price: "$31.300" },
      ],
      summary: {
        subtotal: "$53.950",
        taxes: "$10.250",
        total: "$64.200",
      },
      timeline: [
        { time: "09:47", titleKey: "eventReceived" },
        { time: "09:49", titleKey: "eventConfirmedAi", actor: "Sofia" },
      ],
    },
  },
  {
    orderNumber: "#1039",
    customerName: "Martin Silva",
    phone: "+56 9 5532 7711",
    channel: "uberEats",
    status: "PENDING",
    totalCents: 35700,
    minutesAgo: 43,
    preparationMins: 6,
    assignedTo: "Ignacio",
    notes: "Courier estimado 10:18.",
    details: {
      history: "Delivery marketplace",
      items: [
        { name: "Pizza prosciutto", quantity: 1, price: "$22.900" },
        { name: "Tiramisu", quantity: 1, price: "$12.800" },
      ],
      summary: {
        subtotal: "$30.000",
        taxes: "$5.700",
        total: "$35.700",
      },
      timeline: [{ time: "09:42", titleKey: "eventReceived" }],
    },
  },
  {
    orderNumber: "#1038",
    customerName: "Antonia Perez",
    phone: "+56 9 7744 1900",
    channel: "rappi",
    status: "COMPLETED",
    totalCents: 19900,
    minutesAgo: 65,
    preparationMins: 43,
    assignedTo: "Camila",
    notes: "Entrega completada sin incidentes.",
    details: {
      history: "Cliente frecuente · 8 pedidos",
      items: [{ name: "Menu ejecutivo", quantity: 1, price: "$19.900" }],
      summary: {
        subtotal: "$16.730",
        taxes: "$3.170",
        total: "$19.900",
      },
      timeline: [
        { time: "09:20", titleKey: "eventReceived" },
        { time: "09:22", titleKey: "eventConfirmedAi", actor: "Bocao AI" },
        { time: "09:30", titleKey: "eventPreparing", actor: "Camila" },
        { time: "09:44", titleKey: "eventReady", actor: "Cocina" },
        { time: "10:03", titleKey: "eventDelivered", actor: "Rappi" },
      ],
    },
  },
  {
    orderNumber: "#1037",
    customerName: "Josefa Lara",
    phone: "+56 9 6651 8892",
    channel: "whatsapp",
    status: "CANCELLED",
    totalCents: 51400,
    minutesAgo: 73,
    preparationMins: 8,
    assignedTo: "Nicolas",
    notes: "Cliente pidio reintentar mas tarde.",
    details: {
      history: "Cancelado por cambio de direccion",
      items: [
        { name: "Ramen miso", quantity: 2, price: "$37.800" },
        { name: "Gyozas", quantity: 1, price: "$13.600" },
      ],
      summary: {
        subtotal: "$43.200",
        taxes: "$8.200",
        total: "$51.400",
      },
      timeline: [
        { time: "09:12", titleKey: "eventReceived" },
        { time: "09:14", titleKey: "eventConfirmedAi", actor: "Bocao AI" },
      ],
    },
  },
];

export type DemoMenuCategorySeed = {
  name: string;
  items: Array<{
    name: string;
    description?: string;
    priceCents: number;
    images?: string[];
  }>;
};

export const DEMO_MENU: DemoMenuCategorySeed[] = [
  {
    name: "Principales",
    items: [
      {
        name: "Bocao Burger",
        description: "Doble carne, queso cheddar y salsa de la casa",
        priceCents: 12900,
        images: [
          "https://images.unsplash.com/photo-1568901347635-4cef5a7a8650?w=640&q=80",
        ],
      },
      {
        name: "Wrap pollo grill",
        description: "Pollo grill, vegetales frescos y alioli",
        priceCents: 15600,
        images: [
          "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=640&q=80",
        ],
      },
      {
        name: "Pizza prosciutto",
        description: "Muzzarella, prosciutto y rúcula",
        priceCents: 22900,
        images: [
          "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=640&q=80",
        ],
      },
      {
        name: "Ramen miso",
        description: "Caldo miso, chashu y huevo marinado",
        priceCents: 18900,
        images: [
          "https://images.unsplash.com/photo-1569718212165-3a8278d245f2?w=640&q=80",
        ],
      },
    ],
  },
  {
    name: "Entradas y acompañamientos",
    items: [
      {
        name: "Papas rusticas",
        priceCents: 6900,
        images: [
          "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=640&q=80",
        ],
      },
      {
        name: "Ensalada Cesar",
        priceCents: 12900,
        images: [
          "https://images.unsplash.com/photo-1546793665-c74683f339c1?w=640&q=80",
        ],
      },
      {
        name: "Tabla para compartir",
        priceCents: 32900,
        images: [
          "https://images.unsplash.com/photo-1606756790138-2612751ba686?w=640&q=80",
        ],
      },
      {
        name: "Gyozas",
        priceCents: 13600,
        images: [
          "https://images.unsplash.com/photo-1498654896293-37aacf113fd9?w=640&q=80",
        ],
      },
    ],
  },
  {
    name: "Bebidas y postres",
    items: [
      {
        name: "Limonada menta",
        priceCents: 5100,
        images: [
          "https://images.unsplash.com/photo-1523672067817-099e7d490947?w=640&q=80",
        ],
      },
      {
        name: "Pisco sour",
        priceCents: 7825,
        images: [
          "https://images.unsplash.com/photo-1514362545857-3bc1654c4aad?w=640&q=80",
        ],
      },
      {
        name: "Tiramisu",
        priceCents: 12800,
        images: [
          "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=640&q=80",
        ],
      },
      {
        name: "Menu ejecutivo",
        priceCents: 19900,
        images: [
          "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=640&q=80",
        ],
      },
    ],
  },
];

export const DEMO_RESERVATIONS = [
  {
    guestName: "Familia Herrera",
    guestCount: 4,
    minutesFromNow: 45,
    status: "CONFIRMED" as const,
  },
  {
    guestName: "Lucía Fernández",
    guestCount: 2,
    minutesFromNow: 90,
    status: "PENDING" as const,
  },
  {
    guestName: "Grupo Empresarial Delta",
    guestCount: 8,
    minutesFromNow: 150,
    status: "CONFIRMED" as const,
  },
];

export function buildDemoProfile(restaurantName: string) {
  return {
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
    orderInsights: [
      "El ticket promedio subió 8% en las últimas 4 horas.",
      "WhatsApp concentra el 46% de los pedidos activos.",
      "3 pedidos llevan más de 30 min en preparación.",
      "La IA sugiere ofrecer postre en pedidos con hamburguesas.",
    ],
    whatsapp: {
      connected: true,
      unreadCount: 7,
      lastMessageAt: "Hace 3 min",
      responseRate: "94%",
    },
    teamActivity: [
      { id: "team-1", name: "Valentina", role: "Cocina", status: "busy" },
      { id: "team-2", name: "Diego", role: "Salón", status: "online" },
      { id: "team-3", name: "Camila", role: "WhatsApp", status: "online" },
      { id: "team-4", name: "Andrés", role: "Manager", status: "offline" },
    ],
    metricTrends: {
      "revenue-today": { change: "+12.4% vs ayer", trend: "up" },
      "open-orders": { change: "6 en cocina", trend: "neutral" },
      "upcoming-reservations": { change: "8 en las próximas 3h", trend: "up" },
      "avg-prep-time": { change: "-2 min vs semana pasada", trend: "up" },
    },
  };
}
