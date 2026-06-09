import { z } from "zod";

export const kitchenOrderStatusSchema = z.enum([
  "received",
  "in_preparation",
  "waiting",
  "ready",
  "delivered",
  "delayed",
]);

export const kitchenStationSchema = z.enum([
  "grill",
  "fryer",
  "sushi",
  "bar",
  "desserts",
  "delivery_station",
]);

export const kitchenPrioritySchema = z.enum([
  "normal",
  "high",
  "urgent",
  "delayed",
]);

export const updateKitchenOrderBodySchema = z.object({
  status: kitchenOrderStatusSchema.optional(),
  station: kitchenStationSchema.optional(),
  assignedTo: z.string().trim().min(1).optional(),
  priority: kitchenPrioritySchema.optional(),
});
