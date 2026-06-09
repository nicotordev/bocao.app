export type KitchenOrderStatus =
  | "received"
  | "in_preparation"
  | "waiting"
  | "ready"
  | "delivered"
  | "delayed";

export type KitchenPriority = "normal" | "high" | "urgent" | "delayed";

export type KitchenChannel =
  | "whatsapp"
  | "web"
  | "table"
  | "delivery"
  | "pickup";

export type KitchenStation =
  | "grill"
  | "fryer"
  | "sushi"
  | "bar"
  | "desserts"
  | "delivery_station";

export type KitchenViewMode = "cards" | "kanban" | "timeline";

export type KitchenKanbanStatus = Exclude<KitchenOrderStatus, "delayed">;

export type KitchenOrderItem = {
  id: string;
  quantity: number;
  name: string;
  modifiers?: string[];
  allergens?: string[];
  notes?: string;
};

export type KitchenTimelineEvent = {
  time: string;
  titleKey: keyof KitchenTimelineTitleKeys;
  actor?: string;
  channel?: KitchenChannel;
};

export type KitchenTimelineTitleKeys = {
  eventReceived: string;
  eventAssigned: string;
  eventStarted: string;
  eventPaused: string;
  eventReady: string;
  eventDelivered: string;
  eventDelayed: string;
};

export type KitchenOrder = {
  id: string;
  number: string;
  status: KitchenOrderStatus;
  priority: KitchenPriority;
  channel: KitchenChannel;
  station: KitchenStation;
  customerName?: string;
  tableNumber?: string;
  elapsedMinutes: number;
  slaMinutes: number;
  receivedAt: string;
  items: KitchenOrderItem[];
  kitchenNotes?: string;
  importantNote?: string;
  assignedTo?: string;
  isPaused?: boolean;
  timeline: KitchenTimelineEvent[];
};

export type KitchenKpiValues = {
  active: string;
  averageTime: string;
  delayed: string;
  ready: string;
};

export type KitchenFiltersState = {
  search: string;
  station: KitchenStation | "all";
  priority: KitchenPriority | "all";
  channel: KitchenChannel | "all";
};
