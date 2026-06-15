import { z } from "zod";

export const customerSmartSegmentItemSchema = z.object({
  id: z
    .string()
    .min(1)
    .max(64)
    .regex(/^[a-z0-9_-]+$/),
  name: z.string().min(1).max(120),
  description: z.string().min(1).max(400),
  customerIds: z.array(z.string().min(1)).min(1).max(500),
  rationale: z.string().max(400).optional(),
});

export const customerSmartSegmentsResponseSchema = z.object({
  segments: z.array(customerSmartSegmentItemSchema).min(2).max(8),
});

export type CustomerSmartSegmentsResponse = z.infer<
  typeof customerSmartSegmentsResponseSchema
>;
