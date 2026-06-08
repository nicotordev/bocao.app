"use client";

import { Plus, X } from "lucide-react";
import { useLocale } from "next-intl";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { defaultLocale, locales, type Locale } from "@/i18n/locales";
import type { MenuCustomTagRecord } from "@/lib/menu/custom-tags";
import type { MenuTagIconId } from "@/lib/menu/tag-icons";
import {
  createCustomMenuTag,
  mergeMenuItemTagsWithCustomDefinitions,
  normalizeMenuItemTags,
  resolveMenuTagLabel,
} from "@/lib/menu/tag-utils";
import {
  isMenuTagCatalogKey,
  MENU_TAG_CATALOG,
  type MenuItemTag,
} from "@/lib/menu/tag-types";
import { cn } from "@/lib/utils";
import { MenuTagIconGlyph, MenuTagIconPicker } from "./menu-tag-icon-picker";

export type MenuCatalogTagOption = {
  key: string;
  label: string;
  icon: MenuTagIconId;
};

export type MenuItemTagsFieldLabels = {
  label: string;
  catalog: string;
  customLabel: string;
  customPlaceholder: string;
  add: string;
  remove: string;
  suggestions: string;
  pickIcon: string;
  languages: string;
};

type MenuItemTagsFieldProps = {
  labels: MenuItemTagsFieldLabels;
  localeOptions: Array<{ value: Locale; label: string }>;
  catalogTags: MenuCatalogTagOption[];
  catalogLabels: Record<string, string>;
  customTagDefinitions: MenuCustomTagRecord[];
  value: MenuItemTag[];
  suggestions: MenuItemTag[];
  onChange: (tags: MenuItemTag[]) => void;
  disabled?: boolean;
};

function emptyCustomDraft(locale: Locale): {
  enabledLocales: Locale[];
  translations: Partial<Record<Locale, string>>;
  icon: MenuTagIconId;
} {
  return {
    enabledLocales: [locale],
    translations: { [locale]: "" },
    icon: "TbStar",
  };
}

export function MenuItemTagsField({
  labels,
  localeOptions,
  catalogTags,
  catalogLabels,
  customTagDefinitions,
  value,
  suggestions,
  onChange,
  disabled = false,
}: MenuItemTagsFieldProps) {
  const locale = useLocale() as Locale;
  const [customDraft, setCustomDraft] = useState(() => emptyCustomDraft(locale));

  const customTagsByKey = useMemo(
    () => Object.fromEntries(customTagDefinitions.map((tag) => [tag.key, tag])),
    [customTagDefinitions],
  );

  const customLabels = useMemo(
    () =>
      Object.fromEntries(
        customTagDefinitions
          .map((tag) => {
            const label =
              tag.translations[locale] ??
              tag.translations[defaultLocale] ??
              Object.values(tag.translations).find(Boolean);
            return label ? [tag.key, label] : null;
          })
          .filter((entry): entry is [string, string] => entry !== null),
      ),
    [customTagDefinitions, locale],
  );

  const selectedKeys = useMemo(
    () => new Set(value.map((tag) => tag.key)),
    [value],
  );

  const customSuggestions = useMemo(() => {
    return suggestions.filter(
      (tag) => !isMenuTagCatalogKey(tag.key) && !selectedKeys.has(tag.key),
    );
  }, [selectedKeys, suggestions]);

  function setTags(nextTags: MenuItemTag[]) {
    onChange(normalizeMenuItemTags(nextTags));
  }

  function toggleCatalogTag(key: string) {
    if (selectedKeys.has(key)) {
      setTags(value.filter((tag) => tag.key !== key));
      return;
    }

    if (!isMenuTagCatalogKey(key)) {
      return;
    }

    setTags([
      ...value,
      {
        key,
        icon: MENU_TAG_CATALOG[key].icon,
      },
    ]);
  }

  function removeTag(key: string) {
    setTags(value.filter((tag) => tag.key !== key));
  }

  function toggleDraftLocale(nextLocale: Locale, enabled: boolean) {
    setCustomDraft((current) => {
      const enabledLocales = enabled
        ? [...new Set([...current.enabledLocales, nextLocale])]
        : current.enabledLocales.filter((entry) => entry !== nextLocale);

      const translations = { ...current.translations };
      if (enabled) {
        translations[nextLocale] ??= "";
      } else {
        delete translations[nextLocale];
      }

      return {
        ...current,
        enabledLocales,
        translations,
      };
    });
  }

  function updateDraftTranslation(nextLocale: Locale, nextValue: string) {
    setCustomDraft((current) => ({
      ...current,
      translations: {
        ...current.translations,
        [nextLocale]: nextValue,
      },
    }));
  }

  function addCustomTagFromDraft() {
    const translations = Object.fromEntries(
      customDraft.enabledLocales
        .map((entry) => [entry, customDraft.translations[entry]?.trim() ?? ""])
        .filter(([, label]) => label.length > 0),
    ) as Partial<Record<Locale, string>>;

    if (Object.keys(translations).length === 0) {
      return;
    }

    const tag = createCustomMenuTag({
      translations,
      icon: customDraft.icon,
    });

    if (!tag || selectedKeys.has(tag.key)) {
      return;
    }

    setTags([...value, tag]);
    setCustomDraft(emptyCustomDraft(locale));
  }

  function addExistingCustomTag(tag: MenuItemTag) {
    const definition = customTagsByKey[tag.key];
    const merged = mergeMenuItemTagsWithCustomDefinitions(
      [tag],
      definition
        ? { [tag.key]: definition }
        : tag.translations
          ? {
              [tag.key]: {
                icon: tag.icon,
                translations: tag.translations,
              },
            }
          : {},
    )[0];

    if (!merged || selectedKeys.has(merged.key)) {
      return;
    }

    setTags([...value, merged]);
  }

  const canSubmitCustom = customDraft.enabledLocales.some((entry) =>
    customDraft.translations[entry]?.trim(),
  );

  return (
    <Field>
      <FieldLabel>{labels.label}</FieldLabel>

      {value.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {value.map((tag) => (
            <Badge
              key={tag.key}
              variant="secondary"
              className="gap-1 rounded-full px-2.5 py-1 text-xs"
            >
              <MenuTagIconGlyph icon={tag.icon} className="size-3" />
              {resolveMenuTagLabel(tag, catalogLabels, customLabels)}
              {!disabled ? (
                <button
                  type="button"
                  className="rounded-full p-0.5 hover:bg-background/70"
                  aria-label={`${labels.remove}: ${resolveMenuTagLabel(tag, catalogLabels, customLabels)}`}
                  onClick={() => removeTag(tag.key)}
                >
                  <X className="size-3" aria-hidden />
                </button>
              ) : null}
            </Badge>
          ))}
        </div>
      ) : null}

      {!disabled ? (
        <div className="mt-4 space-y-4">
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">
              {labels.catalog}
            </p>
            <div className="flex flex-wrap gap-2">
              {catalogTags.map((option) => {
                const isSelected = selectedKeys.has(option.key);

                return (
                  <button
                    key={option.key}
                    type="button"
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                      isSelected
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-background hover:bg-muted",
                    )}
                    onClick={() => toggleCatalogTag(option.key)}
                  >
                    <MenuTagIconGlyph icon={option.icon} className="size-3.5" />
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-3 rounded-2xl border border-border p-3">
            <p className="text-xs font-medium text-muted-foreground">
              {labels.customLabel}
            </p>

            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">{labels.languages}</p>
              <div className="flex flex-wrap gap-3">
                {localeOptions.map((option) => {
                  const checked = customDraft.enabledLocales.includes(
                    option.value,
                  );

                  return (
                    <label
                      key={option.value}
                      className="inline-flex items-center gap-2 text-xs font-medium"
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(nextChecked) =>
                          toggleDraftLocale(option.value, nextChecked === true)
                        }
                      />
                      {option.label}
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              {customDraft.enabledLocales.map((entry) => {
                const option = localeOptions.find(
                  (candidate) => candidate.value === entry,
                );

                return (
                  <Input
                    key={entry}
                    value={customDraft.translations[entry] ?? ""}
                    onChange={(event) =>
                      updateDraftTranslation(entry, event.target.value)
                    }
                    placeholder={`${labels.customPlaceholder} (${option?.label ?? entry})`}
                    className="rounded-3xl"
                  />
                );
              })}
            </div>

            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">{labels.pickIcon}</p>
              <MenuTagIconPicker
                value={customDraft.icon}
                onChange={(icon) =>
                  setCustomDraft((current) => ({ ...current, icon }))
                }
              />
            </div>

            <Button
              type="button"
              variant="outline"
              className="rounded-3xl"
              onClick={addCustomTagFromDraft}
              disabled={!canSubmitCustom}
            >
              <Plus className="mr-1 size-4" aria-hidden />
              {labels.add}
            </Button>
          </div>

          {customSuggestions.length > 0 ? (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                {labels.suggestions}
              </p>
              <div className="flex flex-wrap gap-2">
                {customSuggestions.map((tag) => {
                  const definition = customTagsByKey[tag.key];
                  const label =
                    resolveMenuTagLabel(tag, catalogLabels, customLabels) ||
                    definition?.translations[locale] ||
                    tag.key;

                  return (
                    <button
                      key={tag.key}
                      type="button"
                      className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1 text-xs font-medium transition-colors hover:bg-muted"
                      onClick={() => addExistingCustomTag(tag)}
                    >
                      {tag.icon || definition?.icon ? (
                        <MenuTagIconGlyph
                          icon={tag.icon ?? definition?.icon}
                          className="size-3.5"
                        />
                      ) : null}
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </Field>
  );
}

export function MenuItemTagsPreview({
  tags,
  catalogLabels,
  customLabels,
  className,
}: {
  tags: MenuItemTag[];
  catalogLabels: Record<string, string>;
  customLabels: Record<string, string>;
  className?: string;
}) {
  if (tags.length === 0) {
    return null;
  }

  return (
    <div className={cn("flex flex-wrap gap-1.5", className)}>
      {tags.map((tag) => (
        <Badge
          key={tag.key}
          variant="outline"
          className="gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium"
        >
          <MenuTagIconGlyph icon={tag.icon} className="size-3" />
          {resolveMenuTagLabel(tag, catalogLabels, customLabels)}
        </Badge>
      ))}
    </div>
  );
}
