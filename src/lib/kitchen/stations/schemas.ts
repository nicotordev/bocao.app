import { z } from "zod";

export const kitchenStationCategorySchema = z.enum([
  "grill",
  "fryer",
  "sushi",
  "bar",
  "desserts",
  "delivery",
  "prep",
  "other",
]);

export const createKitchenStationBodySchema = z.object({
  name: z.string().trim().min(1).max(80),
  description: z.string().trim().max(240).optional().default(""),
  category: kitchenStationCategorySchema,
  isActive: z.boolean().optional().default(true),
  sortOrder: z.number().int().min(0).optional(),
});

export const updateKitchenStationBodySchema = z
  .object({
    name: z.string().trim().min(1).max(80).optional(),
    description: z.string().trim().max(240).optional(),
    category: kitchenStationCategorySchema.optional(),
    isActive: z.boolean().optional(),
    sortOrder: z.number().int().min(0).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required",
  });

export const reorderKitchenStationBodySchema = z.object({
  direction: z.enum(["up", "down"]),
});
