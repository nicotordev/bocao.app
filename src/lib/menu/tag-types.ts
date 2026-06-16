import type { MenuTagIconId } from "@/lib/menu/tag-icons";

export type MenuItemTag = {
  key: string;
  icon?: MenuTagIconId;
  /** Custom tag translations stored in DbTranslation */
  translations?: Partial<Record<string, string>>;
  /** Legacy inline label while migrating older records */
  label?: string;
};

export const MENU_TAG_CATALOG_KEYS = [
  "spicy",
  "hot",
  "vegetarian",
  "vegan",
  "glutenFree",
  "containsNuts",
  "chefChoice",
  "new",
] as const;

export type MenuTagCatalogKey = (typeof MENU_TAG_CATALOG_KEYS)[number];

export const MENU_TAG_CATALOG: Record<
  MenuTagCatalogKey,
  { icon: MenuTagIconId }
> = {
  spicy: { icon: "TbFlame" },
  hot: { icon: "TbTemperature" },
  vegetarian: { icon: "TbLeaf" },
  vegan: { icon: "TbPlant" },
  glutenFree: { icon: "TbWheatOff" },
  containsNuts: { icon: "TbAlertTriangle" },
  chefChoice: { icon: "TbChefHat" },
  new: { icon: "TbSparkles" },
};

export function isMenuTagCatalogKey(key: string): key is MenuTagCatalogKey {
  return MENU_TAG_CATALOG_KEYS.includes(key as MenuTagCatalogKey);
}

export function slugifyMenuTagLabel(label: string) {
  return label
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}
