import type { IconType } from "react-icons";
import {
  TbAlertTriangle,
  TbChefHat,
  TbFlame,
  TbLeaf,
  TbPlant,
  TbSparkles,
  TbStar,
  TbTemperature,
  TbWheatOff,
  TbFish,
  TbMeat,
  TbEgg,
  TbMilk,
  TbClock,
  TbHeart,
  TbBolt,
  TbSnowflake,
  TbCup,
  TbPizza,
  TbToolsKitchen2,
} from "react-icons/tb";

export const MENU_TAG_ICON_IDS = [
  "TbFlame",
  "TbTemperature",
  "TbLeaf",
  "TbPlant",
  "TbWheatOff",
  "TbAlertTriangle",
  "TbChefHat",
  "TbSparkles",
  "TbStar",
  "TbFish",
  "TbMeat",
  "TbEgg",
  "TbMilk",
  "TbClock",
  "TbHeart",
  "TbBolt",
  "TbSnowflake",
  "TbCup",
  "TbPizza",
  "TbToolsKitchen2",
] as const;

export type MenuTagIconId = (typeof MENU_TAG_ICON_IDS)[number];

export const MENU_TAG_ICONS: Record<MenuTagIconId, IconType> = {
  TbFlame,
  TbTemperature,
  TbLeaf,
  TbPlant,
  TbWheatOff,
  TbAlertTriangle,
  TbChefHat,
  TbSparkles,
  TbStar,
  TbFish,
  TbMeat,
  TbEgg,
  TbMilk,
  TbClock,
  TbHeart,
  TbBolt,
  TbSnowflake,
  TbCup,
  TbPizza,
  TbToolsKitchen2,
};

export function isMenuTagIconId(value: string): value is MenuTagIconId {
  return MENU_TAG_ICON_IDS.includes(value as MenuTagIconId);
}

export function getMenuTagIcon(icon?: string) {
  if (!icon || !isMenuTagIconId(icon)) {
    return null;
  }

  return MENU_TAG_ICONS[icon];
}
