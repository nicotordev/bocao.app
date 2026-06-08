import type { Locale } from "@/i18n/locales";
import { isMenuTagIconId, type MenuTagIconId } from "@/lib/menu/tag-icons";
import { isMenuTagCatalogKey, type MenuItemTag } from "@/lib/menu/tag-types";
import { prisma } from "@/lib/prisma";
import { listDbTranslations, syncMenuCustomTagTranslations } from "@/lib/translations/repository";
import {
  DB_TRANSLATION_ENTITY,
  DB_TRANSLATION_FIELD,
  resolveDbTranslation,
  type DbTranslationMap,
} from "@/lib/translations/types";

export type MenuCustomTagRecord = {
  key: string;
  icon?: MenuTagIconId;
  translations: Partial<Record<Locale, string>>;
};

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
        fields[DB_TRANSLATION_FIELD.LABEL],
      ]),
    ),
  }));
}

export async function upsertMenuCustomTag(
  restaurantId: string,
  input: {
    key: string;
    icon?: MenuTagIconId;
    translations: Partial<Record<Locale, string>>;
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

export function buildMenuCustomTagLabelMap(
  records: MenuCustomTagRecord[],
  locale: Locale,
  fallbackLocale?: Locale,
) {
  const map: Record<string, string> = {};

  for (const record of records) {
    const label = resolveMenuCustomTagLabel(record, locale, fallbackLocale);
    if (label) {
      map[record.key] = label;
    }
  }

  return map;
}

export function resolveMenuCustomTagLabel(
  record: MenuCustomTagRecord,
  locale: Locale,
  fallbackLocale?: Locale,
) {
  const fromRecord = record.translations[locale]?.trim();
  if (fromRecord) {
    return fromRecord;
  }

  if (fallbackLocale) {
    const fallback = record.translations[fallbackLocale]?.trim();
    if (fallback) {
      return fallback;
    }
  }

  for (const value of Object.values(record.translations)) {
    const candidate = value?.trim();
    if (candidate) {
      return candidate;
    }
  }

  return undefined;
}

export function menuCustomTagsToMap(records: MenuCustomTagRecord[]) {
  return Object.fromEntries(records.map((record) => [record.key, record]));
}

export function menuCustomTagsToTranslationMap(
  records: MenuCustomTagRecord[],
): DbTranslationMap {
  const map: DbTranslationMap = {};

  for (const record of records) {
    map[record.key] = Object.fromEntries(
      Object.entries(record.translations)
        .filter(([, label]) => label?.trim())
        .map(([locale, label]) => [
          locale,
          { [DB_TRANSLATION_FIELD.LABEL]: label!.trim() },
        ]),
    );
  }

  return map;
}

export function resolveMenuCustomTagLabelFromRecords(
  recordsByKey: Record<string, MenuCustomTagRecord>,
  entityKey: string,
  locale: Locale,
  fallbackLocale?: Locale,
) {
  const record = recordsByKey[entityKey];
  if (!record) {
    return undefined;
  }

  return resolveMenuCustomTagLabel(record, locale, fallbackLocale);
}

export function resolveMenuCustomTagLabelFromTranslationMap(
  map: DbTranslationMap,
  entityKey: string,
  locale: Locale,
  fallbackLocale?: Locale,
) {
  return resolveDbTranslation(
    map,
    entityKey,
    locale,
    DB_TRANSLATION_FIELD.LABEL,
    fallbackLocale,
  );
}
