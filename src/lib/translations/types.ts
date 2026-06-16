export const DB_TRANSLATION_ENTITY = {
  MENU_CUSTOM_TAG: "menu_custom_tag",
  MENU_ITEM: "menu_item",
} as const;

export type DbTranslationEntityType =
  (typeof DB_TRANSLATION_ENTITY)[keyof typeof DB_TRANSLATION_ENTITY];

export const DB_TRANSLATION_FIELD = {
  LABEL: "label",
  NAME: "name",
  DESCRIPTION: "description",
} as const;

export type DbTranslationField =
  (typeof DB_TRANSLATION_FIELD)[keyof typeof DB_TRANSLATION_FIELD];

export type DbTranslationMap = Record<
  string,
  Partial<Record<string, Partial<Record<DbTranslationField, string>>>>
>;

export type DbTranslationInput = {
  entityType: DbTranslationEntityType;
  entityKey: string;
  locale: string;
  field: DbTranslationField;
  value: string;
};

export function resolveDbTranslation(
  map: DbTranslationMap,
  entityKey: string,
  locale: string,
  field: DbTranslationField,
  fallbackLocale?: string,
) {
  const entry = map[entityKey];
  const value = entry?.[locale]?.[field]?.trim();
  if (value) {
    return value;
  }

  if (fallbackLocale) {
    const fallback = entry?.[fallbackLocale]?.[field]?.trim();
    if (fallback) {
      return fallback;
    }
  }

  for (const localeEntry of Object.values(entry ?? {})) {
    const candidate = localeEntry?.[field]?.trim();
    if (candidate) {
      return candidate;
    }
  }

  return undefined;
}

export function buildDbTranslationMap(
  rows: Array<{
    entityKey: string;
    locale: string;
    field: string;
    value: string;
  }>,
) {
  const map: DbTranslationMap = {};

  for (const row of rows) {
    const entityKey = row.entityKey.trim();
    const locale = row.locale.trim();
    const field = row.field.trim() as DbTranslationField;
    const value = row.value.trim();

    if (!entityKey || !locale || !field || !value) {
      continue;
    }

    map[entityKey] ??= {};
    map[entityKey][locale] ??= {};
    map[entityKey][locale]![field] = value;
  }

  return map;
}
