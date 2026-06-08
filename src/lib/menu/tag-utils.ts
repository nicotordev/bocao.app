import { isMenuTagIconId } from "@/lib/menu/tag-icons";
import {
  isMenuTagCatalogKey,
  MENU_TAG_CATALOG,
  slugifyMenuTagLabel,
  type MenuItemTag,
} from "@/lib/menu/tag-types";

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
        icon: tag.icon && isMenuTagIconId(tag.icon)
          ? tag.icon
          : MENU_TAG_CATALOG[key].icon,
      });
      continue;
    }

    const label = tag.label?.trim();
    if (!label) {
      continue;
    }

    normalized.push({
      key,
      label,
      icon: tag.icon && isMenuTagIconId(tag.icon) ? tag.icon : undefined,
    });
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

      parsed.push({
        key,
        icon:
          typeof record.icon === "string" && isMenuTagIconId(record.icon)
            ? record.icon
            : undefined,
        label: typeof record.label === "string" ? record.label.trim() : undefined,
      });
    }

    return normalizeMenuItemTags(parsed);
  }

  return [];
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

export function createCustomMenuTag(label: string, icon?: MenuItemTag["icon"]) {
  const trimmed = label.trim();
  const slug = slugifyMenuTagLabel(trimmed) || "tag";

  return normalizeMenuItemTags([
    {
      key: `custom-${slug}`,
      label: trimmed,
      icon,
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
) {
  if (isMenuTagCatalogKey(tag.key)) {
    return catalogLabels[tag.key] ?? tag.key;
  }

  return tag.label ?? tag.key;
}

export function menuTagMatchesQuery(
  tag: MenuItemTag,
  query: string,
  catalogLabels: Record<string, string>,
) {
  const label = resolveMenuTagLabel(tag, catalogLabels).toLowerCase();
  return label.includes(query) || tag.key.toLowerCase().includes(query);
}
