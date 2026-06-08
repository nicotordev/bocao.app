import { z } from "zod";

export const orderStatusSchema = z.enum([
  "received",
  "confirmed",
  "preparing",
  "ready",
  "delivered",
  "cancelled",
]);

export const orderChannelSchema = z.enum([
  "whatsapp",
  "web",
  "dineIn",
  "uberEats",
  "rappi",
]);

export const updateOrderStatusBodySchema = z.object({
  status: orderStatusSchema,
});
