import { z } from "zod";

export const createCustomerBodySchema = z.object({
  name: z.string().trim().min(1),
  phone: z.string().trim().optional(),
  email: z.string().trim().optional(),
  documentId: z.string().trim().optional(),
  address: z.string().trim().optional(),
  notes: z.string().trim().optional(),
  avatar: z.string().trim().url().optional(),
});

export const deleteCustomersBodySchema = z.object({
  customerIds: z.array(z.string().min(1)).min(1),
});
