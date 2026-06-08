import type { MenuItemTag } from "@/lib/menu/tag-types";
import type { MenuItemFieldTranslations } from "@/lib/menu/item-translations";

export type MenuItemOption = {
  id: string;
  name: string;
  description: string | null;
  priceCents: number;
  categoryName: string;
  images: string[];
  tags: MenuItemTag[];
  translations: MenuItemFieldTranslations;
};

export type MenuItemRecord = MenuItemOption & {
  isAvailable: boolean;
  categoryId: string;
  sortOrder: number;
};

export type MenuCategoryRecord = {
  id: string;
  name: string;
  sortOrder: number;
  isActive: boolean;
  itemCount: number;
};
