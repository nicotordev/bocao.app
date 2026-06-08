export type BusinessTypeValue =
  | "RESTAURANT"
  | "BAR"
  | "CAFE"
  | "DARK_KITCHEN"
  | "OTHER";

export type PrimaryGoalValue =
  | "ORDERS"
  | "RESERVATIONS"
  | "WHATSAPP"
  | "MENU";

export type ServiceModeValue = "DINE_IN" | "TAKEOUT" | "DELIVERY";

export const BUSINESS_TYPE_OPTIONS: ReadonlyArray<{
  value: BusinessTypeValue;
  label: string;
}> = [
  { value: "RESTAURANT", label: "Restaurante" },
  { value: "BAR", label: "Bar" },
  { value: "CAFE", label: "Café" },
  { value: "DARK_KITCHEN", label: "Dark kitchen" },
  { value: "OTHER", label: "Otro" },
];

export const PRIMARY_GOAL_OPTIONS: ReadonlyArray<{
  value: PrimaryGoalValue;
  label: string;
  description: string;
}> = [
  {
    value: "ORDERS",
    label: "Pedidos",
    description: "Gestionar pedidos de salón, takeaway y delivery",
  },
  {
    value: "RESERVATIONS",
    label: "Reservas",
    description: "Organizar mesas y agenda de reservas",
  },
  {
    value: "WHATSAPP",
    label: "WhatsApp",
    description: "Atender clientes y tomar pedidos por chat",
  },
  {
    value: "MENU",
    label: "Menú",
    description: "Digitalizar y administrar tu carta",
  },
];

export const SERVICE_MODE_OPTIONS: ReadonlyArray<{
  value: ServiceModeValue;
  label: string;
}> = [
  { value: "DINE_IN", label: "Salón" },
  { value: "TAKEOUT", label: "Takeaway" },
  { value: "DELIVERY", label: "Delivery" },
];
