import type { Locale } from "@/i18n/locales";
import type { MenuTagIconId } from "@/lib/menu/tag-icons";
import {
  DB_TRANSLATION_FIELD,
  resolveDbTranslation,
  type DbTranslationMap,
} from "@/lib/translations/types";

export type MenuCustomTagRecord = {
  key: string;
  icon?: MenuTagIconId;
  translations: Partial<Record<string, string>>;
};

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
