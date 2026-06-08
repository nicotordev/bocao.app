import { z } from "zod";
import { menuTagsSchema } from "@/lib/menu/tag-schema";

export const updateMenuItemImagesSchema = z.object({
  restaurantId: z.string().cuid(),
  menuItemId: z.string().cuid(),
  images: z.array(z.string().url()).max(8),
});

export const createMenuCategorySchema = z.object({
  restaurantId: z.string().cuid(),
  name: z.string().trim().min(1).max(80),
});

export const updateMenuCategorySchema = z.object({
  restaurantId: z.string().cuid(),
  categoryId: z.string().cuid(),
  name: z.string().trim().min(1).max(80).optional(),
  isActive: z.boolean().optional(),
});

export const createMenuItemSchema = z.object({
  restaurantId: z.string().cuid(),
  categoryId: z.string().cuid(),
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(500).optional(),
  priceCents: z.number().int().min(0),
  isAvailable: z.boolean().default(true),
  images: z.array(z.string().url()).max(8).default([]),
  tags: menuTagsSchema.default([]),
});

export const updateMenuItemSchema = z.object({
  restaurantId: z.string().cuid(),
  menuItemId: z.string().cuid(),
  categoryId: z.string().cuid().optional(),
  name: z.string().trim().min(1).max(120).optional(),
  description: z.string().trim().max(500).nullable().optional(),
  priceCents: z.number().int().min(0).optional(),
  isAvailable: z.boolean().optional(),
  images: z.array(z.string().url()).max(8).optional(),
  tags: menuTagsSchema.optional(),
});

export const deleteMenuCategorySchema = z.object({
  restaurantId: z.string().cuid(),
  categoryId: z.string().cuid(),
});

export const deleteMenuItemSchema = z.object({
  restaurantId: z.string().cuid(),
  menuItemId: z.string().cuid(),
});

export const reorderMenuLayoutSchema = z.object({
  restaurantId: z.string().cuid(),
  categories: z.array(
    z.object({
      id: z.string().cuid(),
      sortOrder: z.number().int().min(0),
    }),
  ),
  items: z.array(
    z.object({
      id: z.string().cuid(),
      categoryId: z.string().cuid(),
      sortOrder: z.number().int().min(0),
    }),
  ),
});
