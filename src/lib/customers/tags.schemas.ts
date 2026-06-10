import { z } from "zod";

const hexColorSchema = z
  .string()
  .trim()
  .regex(/^#[0-9A-Fa-f]{6}$/, "Invalid hex color");

export const createCustomerTagBodySchema = z.object({
  name: z.string().trim().min(1).max(50),
  color: hexColorSchema.optional(),
});

export const updateCustomerBodySchema = z.object({
  name: z.string().trim().min(1).optional(),
  phone: z.string().trim().optional(),
  email: z.string().trim().optional(),
  documentId: z.string().trim().optional(),
  address: z.string().trim().optional(),
  notes: z.string().trim().optional(),
  avatar: z.string().trim().url().optional().or(z.literal("")),
  tagIds: z.array(z.string().min(1)).optional(),
});

export const bulkCustomerTagsBodySchema = z.object({
  customerIds: z.array(z.string().min(1)).min(1),
  tagIds: z.array(z.string().min(1)).min(1),
  operation: z.enum(["add", "remove"]),
});
