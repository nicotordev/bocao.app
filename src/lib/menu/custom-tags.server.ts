import { isMenuTagIconId, type MenuTagIconId } from "@/lib/menu/tag-icons";
import type { MenuCustomTagRecord } from "@/lib/menu/custom-tags.shared";
import { isMenuTagCatalogKey, type MenuItemTag } from "@/lib/menu/tag-types";
import { prisma } from "@/lib/prisma";
import {
  listDbTranslations,
  syncMenuCustomTagTranslations,
} from "@/lib/translations/repository";
import {
  DB_TRANSLATION_ENTITY,
  DB_TRANSLATION_FIELD,
} from "@/lib/translations/types";

export type { MenuCustomTagRecord } from "@/lib/menu/custom-tags.shared";

export async function listMenuCustomTags(
  restaurantId: string,
): Promise<MenuCustomTagRecord[]> {
  const [tags, translationMap] = await Promise.all([
    prisma.menuCustomTag.findMany({
      where: { restaurantId },
      orderBy: { key: "asc" },
    }),
    listDbTranslations(restaurantId, DB_TRANSLATION_ENTITY.MENU_CUSTOM_TAG),
  ]);

  return tags.map((tag) => ({
    key: tag.key,
    icon: tag.icon && isMenuTagIconId(tag.icon) ? tag.icon : undefined,
    translations: Object.fromEntries(
      Object.entries(translationMap[tag.key] ?? {}).map(([locale, fields]) => [
        locale,
        fields?.[DB_TRANSLATION_FIELD.LABEL],
      ]),
    ),
  }));
}

export async function upsertMenuCustomTag(
  restaurantId: string,
  input: {
    key: string;
    icon?: MenuTagIconId;
    translations: Partial<Record<string, string>>;
  },
) {
  await prisma.menuCustomTag.upsert({
    where: {
      restaurantId_key: {
        restaurantId,
        key: input.key,
      },
    },
    create: {
      restaurantId,
      key: input.key,
      icon: input.icon,
    },
    update: {
      icon: input.icon,
    },
  });

  await syncMenuCustomTagTranslations(
    restaurantId,
    input.key,
    input.translations,
  );
}

export async function syncMenuCustomTagsFromItemTags(
  restaurantId: string,
  tags: MenuItemTag[],
) {
  const customTags = tags.filter((tag) => !isMenuTagCatalogKey(tag.key));

  await Promise.all(
    customTags.map((tag) => {
      const translations =
        tag.translations ?? (tag.label ? { es: tag.label } : {});

      return upsertMenuCustomTag(restaurantId, {
        key: tag.key,
        icon: tag.icon,
        translations,
      });
    }),
  );
}
