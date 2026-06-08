export type OrderStatus =
  | "received"
  | "confirmed"
  | "preparing"
  | "ready"
  | "delivered"
  | "cancelled";

export type OrderChannel = "whatsapp" | "web" | "dineIn" | "uberEats" | "rappi";

export type OrderItem = {
  name: string;
  quantity: number;
  price: string;
};

export type OrderTimelineEvent = {
  time: string;
  titleKey: string;
  actor?: string;
};

export type Order = {
  id: string;
  customerName: string;
  phone: string;
  channel: OrderChannel;
  status: OrderStatus;
  total: string;
  createdAt: string;
  waitMinutes: number;
  owner: string;
  history: string;
  notes: string;
  items: OrderItem[];
  summary: {
    subtotal: string;
    taxes: string;
    total: string;
  };
  timeline: OrderTimelineEvent[];
};

/** @deprecated Use `Order` — kept for existing dashboard components. */
export type DashboardOrder = Order;

export type OrdersListResponse = {
  orders: Order[];
  restaurantId: string;
  updatedAt: string;
};

export type UpdateOrderStatusInput = {
  status: OrderStatus;
};

export type UpdateOrderStatusResponse = {
  order: Order;
};
