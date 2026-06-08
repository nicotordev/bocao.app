export type BusinessTypeValue =
  | "RESTAURANT"
  | "BAR"
  | "CAFE"
  | "DARK_KITCHEN"
  | "OTHER";

export type PrimaryGoalValue = "ORDERS" | "RESERVATIONS" | "WHATSAPP" | "MENU";

export type ServiceModeValue = "DINE_IN" | "TAKEOUT" | "DELIVERY";

export const BUSINESS_TYPE_VALUES = [
  "RESTAURANT",
  "BAR",
  "CAFE",
  "DARK_KITCHEN",
  "OTHER",
] as const satisfies readonly BusinessTypeValue[];

export const PRIMARY_GOAL_VALUES = [
  "ORDERS",
  "RESERVATIONS",
  "WHATSAPP",
  "MENU",
] as const satisfies readonly PrimaryGoalValue[];

export const SERVICE_MODE_VALUES = [
  "DINE_IN",
  "TAKEOUT",
  "DELIVERY",
] as const satisfies readonly ServiceModeValue[];
