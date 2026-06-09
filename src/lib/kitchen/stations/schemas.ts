import { MENU_TAG_ICON_IDS } from "@/lib/menu/tag-icons";
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

const kitchenStationImageUrlSchema = z
  .union([z.string().url().max(2048), z.literal(""), z.null()])
  .optional();

const kitchenStationIconIdSchema = z
  .union([z.enum(MENU_TAG_ICON_IDS), z.literal(""), z.null()])
  .optional();

export const createKitchenStationBodySchema = z.object({
  name: z.string().trim().min(1).max(80),
  description: z.string().trim().max(240).optional().default(""),
  category: kitchenStationCategorySchema,
  imageUrl: kitchenStationImageUrlSchema,
  iconId: kitchenStationIconIdSchema,
  isActive: z.boolean().optional().default(true),
  sortOrder: z.number().int().min(0).optional(),
});

export const updateKitchenStationBodySchema = z
  .object({
    name: z.string().trim().min(1).max(80).optional(),
    description: z.string().trim().max(240).optional(),
    category: kitchenStationCategorySchema.optional(),
    imageUrl: kitchenStationImageUrlSchema,
    iconId: kitchenStationIconIdSchema,
    isActive: z.boolean().optional(),
    sortOrder: z.number().int().min(0).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required",
  });

export const reorderKitchenStationBodySchema = z.object({
  direction: z.enum(["up", "down"]),
});
