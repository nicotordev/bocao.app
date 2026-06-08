import type { Locale } from "@/i18n/locales";
import { defaultLocale, locales } from "@/i18n/locales";
import {
  DB_TRANSLATION_ENTITY,
  DB_TRANSLATION_FIELD,
  resolveDbTranslation,
  type DbTranslationMap,
} from "@/lib/translations/types";
import type { MenuItemRecord } from "@/lib/menu/types";

export type MenuItemFieldTranslations = {
  name: Partial<Record<Locale, string>>;
  description: Partial<Record<Locale, string>>;
};

export function buildMenuItemTranslations(
  item: { id: string; name: string; description: string | null },
  map: DbTranslationMap,
): MenuItemFieldTranslations {
  const entry = map[item.id] ?? {};

  const name: Partial<Record<Locale, string>> = {
    [defaultLocale]: item.name,
  };
  const description: Partial<Record<Locale, string>> = {};

  if (item.description?.trim()) {
    description[defaultLocale] = item.description.trim();
  }

  for (const locale of locales) {
    if (locale === defaultLocale) {
      continue;
    }

    const translatedName = entry[locale]?.[DB_TRANSLATION_FIELD.NAME]?.trim();
    if (translatedName) {
      name[locale] = translatedName;
    }

    const translatedDescription =
      entry[locale]?.[DB_TRANSLATION_FIELD.DESCRIPTION]?.trim();
    if (translatedDescription) {
      description[locale] = translatedDescription;
    }
  }

  return { name, description };
}

export function resolveMenuItemName(
  item: Pick<MenuItemRecord, "name" | "translations">,
  locale: Locale,
  fallbackLocale: Locale = defaultLocale,
) {
  const fromTranslations = item.translations?.name?.[locale]?.trim();
  if (fromTranslations) {
    return fromTranslations;
  }

  if (locale === fallbackLocale) {
    return item.name;
  }

  const fallback = item.translations?.name?.[fallbackLocale]?.trim();
  return fallback || item.name;
}

export function resolveMenuItemDescription(
  item: Pick<MenuItemRecord, "description" | "translations">,
  locale: Locale,
  fallbackLocale: Locale = defaultLocale,
) {
  const fromTranslations = item.translations?.description?.[locale]?.trim();
  if (fromTranslations) {
    return fromTranslations;
  }

  if (locale === fallbackLocale) {
    return item.description;
  }

  const fallback = item.translations?.description?.[fallbackLocale]?.trim();
  return fallback ?? item.description;
}

export function menuItemMatchesQuery(
  item: Pick<MenuItemRecord, "name" | "description" | "translations">,
  query: string,
) {
  const values = new Set<string>([
    item.name.toLowerCase(),
    item.description?.toLowerCase() ?? "",
  ]);

  for (const label of Object.values(item.translations?.name ?? {})) {
    if (label?.trim()) {
      values.add(label.trim().toLowerCase());
    }
  }

  for (const label of Object.values(item.translations?.description ?? {})) {
    if (label?.trim()) {
      values.add(label.trim().toLowerCase());
    }
  }

  return [...values].some((value) => value.includes(query));
}

export function normalizeMenuItemTranslationInput(
  input: MenuItemFieldTranslations,
): MenuItemFieldTranslations {
  const name: Partial<Record<Locale, string>> = {};
  const description: Partial<Record<Locale, string>> = {};

  for (const locale of locales) {
    const nextName = input.name[locale]?.trim();
    if (nextName) {
      name[locale] = nextName;
    }

    const nextDescription = input.description[locale]?.trim();
    if (nextDescription) {
      description[locale] = nextDescription;
    }
  }

  return { name, description };
}

export function extractCanonicalMenuItemFields(
  translations: MenuItemFieldTranslations,
  fallbackLocale: Locale = defaultLocale,
) {
  const normalized = normalizeMenuItemTranslationInput(translations);
  const name =
    normalized.name[fallbackLocale]?.trim() ??
    Object.values(normalized.name).find(Boolean)?.trim() ??
    "";

  const description =
    normalized.description[fallbackLocale]?.trim() ??
    Object.values(normalized.description).find(Boolean)?.trim() ??
    null;

  return { name, description, normalized };
}

export function buildMenuItemTranslationInputs(
  menuItemId: string,
  translations: MenuItemFieldTranslations,
  fallbackLocale: Locale = defaultLocale,
) {
  const normalized = normalizeMenuItemTranslationInput(translations);
  const inputs: Array<{
    entityType: typeof DB_TRANSLATION_ENTITY.MENU_ITEM;
    entityKey: string;
    locale: Locale;
    field: typeof DB_TRANSLATION_FIELD.NAME | typeof DB_TRANSLATION_FIELD.DESCRIPTION;
    value: string;
  }> = [];

  for (const locale of locales) {
    if (locale === fallbackLocale) {
      continue;
    }

    const name = normalized.name[locale]?.trim();
    if (name) {
      inputs.push({
        entityType: DB_TRANSLATION_ENTITY.MENU_ITEM,
        entityKey: menuItemId,
        locale,
        field: DB_TRANSLATION_FIELD.NAME,
        value: name,
      });
    }

    const description = normalized.description[locale]?.trim();
    if (description) {
      inputs.push({
        entityType: DB_TRANSLATION_ENTITY.MENU_ITEM,
        entityKey: menuItemId,
        locale,
        field: DB_TRANSLATION_FIELD.DESCRIPTION,
        value: description,
      });
    }
  }

  return inputs;
}

export function resolveMenuItemFieldFromMap(
  map: DbTranslationMap,
  menuItemId: string,
  locale: Locale,
  field:
    | typeof DB_TRANSLATION_FIELD.NAME
    | typeof DB_TRANSLATION_FIELD.DESCRIPTION,
  fallbackLocale: Locale = defaultLocale,
) {
  return resolveDbTranslation(map, menuItemId, locale, field, fallbackLocale);
}
