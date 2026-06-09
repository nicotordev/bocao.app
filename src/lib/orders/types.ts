export type OrderStatus =
  | "received"
  | "confirmed"
  | "preparing"
  | "ready"
  | "delivered"
  | "cancelled";

export type OrderChannel = "whatsapp" | "web" | "dineIn" | "uberEats" | "rappi";

import type { OrderLineCustomization } from "@/lib/product-flow/types";

export type { OrderLineCustomization };

export type OrderItem = {
  name: string;
  quantity: number;
  price: string;
  imageUrls?: string[];
  customization?: OrderLineCustomization;
};

export type OrderTimelineEvent = {
  time: string;
  titleKey: string;
  actor?: string;
};

export type Order = {
  id: string;
  customerName: string;
  customerNames: string[];
  phone: string;
  tableNumber?: string;
  channel: OrderChannel;
  status: OrderStatus;
  total: string;
  totalCents?: number;
  createdAt: string;
  createdAtDate: string;
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

import type { PaginationMeta } from "@/lib/pagination";

export type OrdersListResponse = {
  orders: Order[];
  restaurantId: string;
  updatedAt: string;
  insights?: string[];
  pagination: PaginationMeta;
};

export type UpdateOrderStatusInput = {
  status: OrderStatus;
};

export type UpdateOrderStatusResponse = {
  order: Order;
};

export type CreateOrderLineItemInput = {
  menuItemId?: string;
  name: string;
  quantity: number;
  priceCents: number;
  imageUrls?: string[];
  customization?: OrderLineCustomization;
};

export type CreateOrderCustomerInput = {
  id?: string;
  name: string;
  phone?: string;
  email?: string;
  documentId?: string;
  address?: string;
  notes?: string;
};

export type CreateOrderInput = {
  customers: CreateOrderCustomerInput[];
  tableNumber?: string;
  channel: OrderChannel;
  notes?: string;
  items: CreateOrderLineItemInput[];
};

export type CreateOrderResponse = {
  order: Order;
};
