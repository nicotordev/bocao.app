import { z } from "zod";
import { menuTagsSchema } from "@/lib/menu/tag-schema";
import {
  extractCanonicalMenuItemFields,
  normalizeMenuItemTranslationInput,
} from "@/lib/menu/item-translations";
import { menuItemTranslationsPayloadSchema } from "@/lib/menu/item-translations-schema";

const menuEntityIdSchema = z.string().trim().min(1);

export const updateMenuItemImagesSchema = z.object({
  restaurantId: menuEntityIdSchema,
  menuItemId: menuEntityIdSchema,
  images: z.array(z.string().url()).max(8),
});

export const createMenuCategorySchema = z.object({
  restaurantId: menuEntityIdSchema,
  name: z.string().trim().min(1).max(80),
});

export const updateMenuCategorySchema = z.object({
  restaurantId: menuEntityIdSchema,
  categoryId: menuEntityIdSchema,
  name: z.string().trim().min(1).max(80).optional(),
  isActive: z.boolean().optional(),
});

export const createMenuItemSchema = z
  .object({
    restaurantId: menuEntityIdSchema,
    categoryId: menuEntityIdSchema,
    priceCents: z.number().int().min(0),
    isAvailable: z.boolean().default(true),
    images: z.array(z.string().url()).max(8).default([]),
    tags: menuTagsSchema.default([]),
    translations: menuItemTranslationsPayloadSchema,
  })
  .transform((data) => {
    const normalized = normalizeMenuItemTranslationInput(data.translations);
    const { name, description } = extractCanonicalMenuItemFields(normalized);

    return {
      ...data,
      name,
      description: description ?? undefined,
      translations: normalized,
    };
  });

export const updateMenuItemSchema = z
  .object({
    restaurantId: menuEntityIdSchema,
    menuItemId: menuEntityIdSchema,
    categoryId: menuEntityIdSchema.optional(),
    priceCents: z.number().int().min(0).optional(),
    isAvailable: z.boolean().optional(),
    images: z.array(z.string().url()).max(8).optional(),
    tags: menuTagsSchema.optional(),
    translations: menuItemTranslationsPayloadSchema.optional(),
  })
  .transform((data) => {
    if (!data.translations) {
      return data;
    }

    const normalized = normalizeMenuItemTranslationInput(data.translations);
    const { name, description } = extractCanonicalMenuItemFields(normalized);

    return {
      ...data,
      name,
      description: description ?? null,
      translations: normalized,
    };
  });

export const deleteMenuCategorySchema = z.object({
  restaurantId: menuEntityIdSchema,
  categoryId: menuEntityIdSchema,
});

export const deleteMenuItemSchema = z.object({
  restaurantId: menuEntityIdSchema,
  menuItemId: menuEntityIdSchema,
});

export const reorderMenuLayoutSchema = z.object({
  restaurantId: menuEntityIdSchema,
  categories: z.array(
    z.object({
      id: menuEntityIdSchema,
      sortOrder: z.number().int().min(0),
    }),
  ),
  items: z.array(
    z.object({
      id: menuEntityIdSchema,
      categoryId: menuEntityIdSchema,
      sortOrder: z.number().int().min(0),
    }),
  ),
});
