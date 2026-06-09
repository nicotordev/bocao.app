import { z } from "zod";
import { orderLineCustomizationSchema } from "@/lib/product-flow/schemas";

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

export const createOrderLineItemSchema = z.object({
  menuItemId: z.string().cuid().optional(),
  name: z.string().trim().min(1),
  quantity: z.number().int().min(1).max(99),
  priceCents: z.number().int().min(0),
  imageUrls: z.array(z.string().url()).max(8).optional(),
  customization: orderLineCustomizationSchema.optional(),
});

export const createOrderCustomerSchema = z.object({
  id: z.string().cuid().optional(),
  name: z.string().trim().min(1),
  phone: z.string().trim().optional(),
  email: z.string().trim().optional(),
  documentId: z.string().trim().optional(),
  address: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});

export const createOrderBodySchema = z
  .object({
    customers: z.array(createOrderCustomerSchema).default([]),
    tableNumber: z.string().trim().optional(),
    channel: orderChannelSchema,
    notes: z.string().trim().optional(),
    items: z.array(createOrderLineItemSchema).min(1),
  })
  .superRefine((data, ctx) => {
    if (data.channel === "dineIn" && !data.tableNumber?.trim()) {
      ctx.addIssue({
        code: "custom",
        path: ["tableNumber"],
        message: "Table number is required for dine-in orders",
      });
    }

    if (data.channel !== "dineIn" && data.customers.length === 0) {
      ctx.addIssue({
        code: "custom",
        path: ["customers"],
        message: "At least one customer is required",
      });
    }
  });
