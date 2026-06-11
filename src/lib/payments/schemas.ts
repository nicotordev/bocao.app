import { z } from "zod";

export const paymentMethodSchema = z.enum([
  "cash",
  "card",
  "transfer",
  "qr",
  "other",
  "manual_pending",
]);

export const paymentProviderSchema = z.enum(["manual"]);

export const paymentStatusSchema = z.enum([
  "pending",
  "completed",
  "failed",
  "refunded",
]);

export const createPaymentInputSchema = z.object({
  method: paymentMethodSchema,
  provider: paymentProviderSchema.optional().default("manual"),
});

export const updatePaymentInputSchema = z.object({
  method: paymentMethodSchema.optional(),
  status: paymentStatusSchema.optional(),
});
