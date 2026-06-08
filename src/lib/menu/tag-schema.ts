import { z } from "zod";
import { locales } from "@/i18n/locales";
import { MENU_TAG_ICON_IDS } from "@/lib/menu/tag-icons";
import {
  normalizeMenuItemTags,
  normalizeMenuItemTagsForStorage,
} from "@/lib/menu/tag-utils";

const localeSchema = z.enum(locales);

const menuItemTagTranslationsSchema = z
  .record(localeSchema, z.string().trim().min(1).max(40))
  .optional();

export const menuItemTagSchema = z.object({
  key: z.string().trim().min(1).max(48),
  icon: z.enum(MENU_TAG_ICON_IDS).optional(),
  translations: menuItemTagTranslationsSchema,
  label: z.string().trim().min(1).max(40).optional(),
});

export const menuTagsSchema = z
  .array(menuItemTagSchema)
  .max(12)
  .transform((tags) => normalizeMenuItemTags(tags));

export const menuTagsStorageSchema = z
  .array(menuItemTagSchema)
  .max(12)
  .transform((tags) => normalizeMenuItemTagsForStorage(tags));
