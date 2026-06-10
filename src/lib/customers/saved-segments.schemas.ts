import { z } from "zod";

export const createSavedSegmentBodySchema = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(500).optional(),
  customerIds: z.array(z.string().min(1)).optional(),
});

export const addSavedSegmentMembersBodySchema = z.object({
  customerIds: z.array(z.string().min(1)).min(1),
});
