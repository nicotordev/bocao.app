import type { Locale } from "@/i18n/locales";
import { locales } from "@/i18n/locales";
import { isMenuTagIconId } from "@/lib/menu/tag-icons";
import {
  isMenuTagCatalogKey,
  MENU_TAG_CATALOG,
  slugifyMenuTagLabel,
  type MenuItemTag,
} from "@/lib/menu/tag-types";

export function stripMenuItemTagForStorage(tag: MenuItemTag): MenuItemTag {
  if (isMenuTagCatalogKey(tag.key)) {
    return {
      key: tag.key,
      icon:
        tag.icon && isMenuTagIconId(tag.icon)
          ? tag.icon
          : MENU_TAG_CATALOG[tag.key].icon,
    };
  }

  return {
    key: tag.key,
    icon: tag.icon && isMenuTagIconId(tag.icon) ? tag.icon : undefined,
  };
}

export function normalizeMenuItemTags(tags: MenuItemTag[]) {
  const seen = new Set<string>();
  const normalized: MenuItemTag[] = [];

  for (const tag of tags) {
    const key = tag.key.trim();
    if (!key || seen.has(key)) {
      continue;
    }

    seen.add(key);

    if (isMenuTagCatalogKey(key)) {
      normalized.push({
        key,
        icon:
          tag.icon && isMenuTagIconId(tag.icon)
            ? tag.icon
            : MENU_TAG_CATALOG[key].icon,
      });
      continue;
    }

    const translations = normalizeCustomTagTranslations(tag.translations);
    const legacyLabel = tag.label?.trim();

    if (Object.keys(translations).length === 0 && !legacyLabel) {
      continue;
    }

    normalized.push({
      key,
      icon: tag.icon && isMenuTagIconId(tag.icon) ? tag.icon : undefined,
      translations:
        Object.keys(translations).length > 0
          ? translations
          : legacyLabel
            ? { es: legacyLabel }
            : undefined,
      label: legacyLabel,
    });
  }

  return normalized;
}

export function normalizeMenuItemTagsForStorage(tags: MenuItemTag[]) {
  return normalizeMenuItemTags(tags).map(stripMenuItemTagForStorage);
}

function normalizeCustomTagTranslations(
  translations?: Partial<Record<Locale, string>>,
) {
  const normalized: Partial<Record<Locale, string>> = {};

  for (const locale of locales) {
    const value = translations?.[locale]?.trim();
    if (value) {
      normalized[locale] = value;
    }
  }

  return normalized;
}

export function parseMenuItemTags(value: unknown): MenuItemTag[] {
  if (Array.isArray(value)) {
    if (value.every((entry) => typeof entry === "string")) {
      return normalizeMenuItemTags(
        value.map((entry) => {
          const label = entry.trim();
          const catalogKey = resolveLegacyCatalogKey(label);

          if (catalogKey) {
            return { key: catalogKey, icon: MENU_TAG_CATALOG[catalogKey].icon };
          }

          return {
            key: `custom-${slugifyMenuTagLabel(label) || "tag"}`,
            translations: { es: label },
            label,
          };
        }),
      );
    }

    const parsed: MenuItemTag[] = [];

    for (const entry of value) {
      if (!entry || typeof entry !== "object") {
        continue;
      }

      const record = entry as Record<string, unknown>;
      const key = typeof record.key === "string" ? record.key.trim() : "";
      if (!key) {
        continue;
      }

      const translations = parseInlineTranslations(record.translations);
      const label =
        typeof record.label === "string" ? record.label.trim() : undefined;

      parsed.push({
        key,
        icon:
          typeof record.icon === "string" && isMenuTagIconId(record.icon)
            ? record.icon
            : undefined,
        translations,
        label,
      });
    }

    return normalizeMenuItemTags(parsed);
  }

  return [];
}

function parseInlineTranslations(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return undefined;
  }

  const translations: Partial<Record<Locale, string>> = {};

  for (const locale of locales) {
    const candidate = (value as Record<string, unknown>)[locale];
    if (typeof candidate === "string" && candidate.trim()) {
      translations[locale] = candidate.trim();
    }
  }

  return Object.keys(translations).length > 0 ? translations : undefined;
}

function resolveLegacyCatalogKey(label: string) {
  const slug = slugifyMenuTagLabel(label);

  const legacyMap: Record<string, keyof typeof MENU_TAG_CATALOG> = {
    picante: "spicy",
    spicy: "spicy",
    caliente: "hot",
    hot: "hot",
    vegetariano: "vegetarian",
    vegetarian: "vegetarian",
    vegano: "vegan",
    vegan: "vegan",
    "sin-gluten": "glutenFree",
    "gluten-free": "glutenFree",
    nuevo: "new",
    new: "new",
  };

  return legacyMap[slug];
}

export function createCustomMenuTag(input: {
  translations: Partial<Record<Locale, string>>;
  icon?: MenuItemTag["icon"];
}) {
  const translations = normalizeCustomTagTranslations(input.translations);
  const primaryLabel =
    translations.es ?? translations.en ?? Object.values(translations)[0] ?? "";
  const slug = slugifyMenuTagLabel(primaryLabel) || "tag";

  return normalizeMenuItemTags([
    {
      key: `custom-${slug}`,
      icon: input.icon,
      translations,
    },
  ])[0];
}

export function collectMenuTagSuggestions(items: Array<{ tags: MenuItemTag[] }>) {
  const seen = new Set<string>();
  const suggestions: MenuItemTag[] = [];

  for (const item of items) {
    for (const tag of item.tags) {
      if (seen.has(tag.key)) {
        continue;
      }

      seen.add(tag.key);
      suggestions.push(tag);
    }
  }

  return suggestions.sort((left, right) =>
    left.key.localeCompare(right.key, undefined, { sensitivity: "base" }),
  );
}

export function resolveMenuTagLabel(
  tag: MenuItemTag,
  catalogLabels: Record<string, string>,
  customLabels: Record<string, string> = {},
) {
  if (isMenuTagCatalogKey(tag.key)) {
    return catalogLabels[tag.key] ?? tag.key;
  }

  return (
    customLabels[tag.key] ??
    tag.translations?.es ??
    tag.translations?.en ??
    tag.label ??
    tag.key
  );
}

export function menuTagMatchesQuery(
  tag: MenuItemTag,
  query: string,
  catalogLabels: Record<string, string>,
  customLabels: Record<string, string> = {},
) {
  const values = new Set<string>([
    resolveMenuTagLabel(tag, catalogLabels, customLabels).toLowerCase(),
    tag.key.toLowerCase(),
  ]);

  if (!isMenuTagCatalogKey(tag.key)) {
    for (const label of Object.values(tag.translations ?? {})) {
      if (label?.trim()) {
        values.add(label.trim().toLowerCase());
      }
    }

    if (tag.label?.trim()) {
      values.add(tag.label.trim().toLowerCase());
    }
  }

  return [...values].some((value) => value.includes(query));
}

export function mergeMenuItemTagsWithCustomDefinitions(
  tags: MenuItemTag[],
  customTagsByKey: Record<
    string,
    { icon?: MenuItemTag["icon"]; translations: Partial<Record<Locale, string>> }
  >,
) {
  return tags.map((tag) => {
    if (isMenuTagCatalogKey(tag.key)) {
      return tag;
    }

    const definition = customTagsByKey[tag.key];
    if (!definition) {
      return tag;
    }

    return {
      key: tag.key,
      icon: tag.icon ?? definition.icon,
      translations: definition.translations,
    };
  });
}
