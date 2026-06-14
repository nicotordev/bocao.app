import { z } from "zod";
import { createPaymentInputSchema } from "@/lib/payments/schemas";
import { orderLineCustomizationSchema } from "@/lib/product-flow/schemas";

const orderLineImageSchema = z
  .string()
  .trim()
  .refine(
    (value) => {
      if (value.length === 0) {
        return false;
      }

      if (value.startsWith("/")) {
        return true;
      }

      return z.string().url().safeParse(value).success;
    },
    { message: "Invalid image URL" },
  );

export const orderStatusSchema = z.enum([
  "draft",
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
  "pos",
]);

export const orderKindSchema = z.enum([
  "dineIn",
  "takeout",
  "delivery",
  "whatsapp",
  "pos",
]);

export const createOrderIntentSchema = z.enum(["draft", "confirm"]);

export const updateOrderStatusBodySchema = z.object({
  status: orderStatusSchema,
});

export const createOrderLineItemSchema = z.object({
  menuItemId: z.string().trim().min(1).optional(),
  name: z.string().trim().min(1),
  quantity: z.number().int().min(1).max(99),
  priceCents: z.number().int().min(0),
  imageUrls: z.array(orderLineImageSchema).max(8).optional(),
  customization: orderLineCustomizationSchema.optional(),
});

export const createOrderCustomerSchema = z.object({
  id: z.string().trim().min(1).optional(),
  name: z.string().trim().min(1),
  phone: z.string().trim().optional(),
  email: z.string().trim().optional(),
  documentId: z.string().trim().optional(),
  address: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});

const createOrderBaseSchema = z.object({
  customers: z.array(createOrderCustomerSchema).default([]),
  tableNumber: z.string().trim().optional(),
  kind: orderKindSchema,
  notes: z.string().trim(),
  items: z.array(createOrderLineItemSchema).min(1),
  paymentMethod: createPaymentInputSchema.shape.method,
  intent: createOrderIntentSchema.default("confirm"),
});

export const createOrderBodySchema = createOrderBaseSchema.superRefine(
  (data, ctx) => {
    if (data.kind === "dineIn" && !data.tableNumber?.trim()) {
      ctx.addIssue({
        code: "custom",
        path: ["tableNumber"],
        message: "Table number is required for dine-in orders",
      });
    }
  },
);

export const updateOrderBodySchema = z
  .object({
    customers: z.array(createOrderCustomerSchema).optional(),
    tableNumber: z.string().trim().optional(),
    kind: orderKindSchema.optional(),
    notes: z.string().trim().optional(),
    items: z.array(createOrderLineItemSchema).min(1).optional(),
    paymentMethod: createPaymentInputSchema.shape.method.optional(),
  })
  .refine(
    (data) =>
      data.customers !== undefined ||
      data.tableNumber !== undefined ||
      data.kind !== undefined ||
      data.notes !== undefined ||
      data.items !== undefined ||
      data.paymentMethod !== undefined,
    { message: "At least one field must be provided" },
  );
