import { z } from "zod";
import { MENU_TAG_ICON_IDS } from "@/lib/menu/tag-icons";
import { normalizeMenuItemTags } from "@/lib/menu/tag-utils";

export const menuItemTagSchema = z.object({
  key: z.string().trim().min(1).max(48),
  icon: z.enum(MENU_TAG_ICON_IDS).optional(),
  label: z.string().trim().min(1).max(40).optional(),
});

export const menuTagsSchema = z
  .array(menuItemTagSchema)
  .max(12)
  .transform((tags) => normalizeMenuItemTags(tags));
