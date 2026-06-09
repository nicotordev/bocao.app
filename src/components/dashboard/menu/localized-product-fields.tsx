"use client";

import { useLocale } from "next-intl";
import { useMemo } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { defaultLocale, type Locale } from "@/i18n/locales";
import type { MenuItemFieldTranslations } from "@/lib/menu/item-translations";
import type { MenuLocaleOption } from "./types";

export type LocalizedProductFieldsLabels = {
  languages: string;
  name: string;
  namePlaceholder: string;
  description: string;
  descriptionPlaceholder: string;
};

type LocalizedProductFieldsProps = {
  labels: LocalizedProductFieldsLabels;
  localeOptions: MenuLocaleOption[];
  value: MenuItemFieldTranslations;
  onChange: (value: MenuItemFieldTranslations) => void;
};

function emptyDraft(locale: string): MenuItemFieldTranslations {
  return {
    name: { [locale]: "" },
    description: { [locale]: "" },
  };
}

export function buildProductTranslationDraft(
  translations: MenuItemFieldTranslations,
  locale: string,
): MenuItemFieldTranslations {
  const enabledLocales = new Set<string>();

  for (const [entryLocale, label] of Object.entries(translations.name)) {
    if (label?.trim()) {
      enabledLocales.add(entryLocale);
    }
  }

  for (const [entryLocale, label] of Object.entries(translations.description)) {
    if (label?.trim()) {
      enabledLocales.add(entryLocale);
    }
  }

  if (enabledLocales.size === 0) {
    return emptyDraft(locale);
  }

  return {
    name: Object.fromEntries(
      [...enabledLocales].map((entryLocale) => [
        entryLocale,
        translations.name[entryLocale] ?? "",
      ]),
    ),
    description: Object.fromEntries(
      [...enabledLocales].map((entryLocale) => [
        entryLocale,
        translations.description[entryLocale] ?? "",
      ]),
    ),
  };
}

export function getEnabledProductLocales(value: MenuItemFieldTranslations) {
  const locales = new Set<string>();

  for (const [locale, label] of Object.entries(value.name)) {
    if (label !== undefined) {
      locales.add(locale);
    }
  }

  for (const [locale, label] of Object.entries(value.description)) {
    if (label !== undefined) {
      locales.add(locale);
    }
  }

  return [...locales];
}

export function LocalizedProductFields({
  labels,
  localeOptions,
  value,
  onChange,
}: LocalizedProductFieldsProps) {
  const locale = useLocale() as Locale;
  const enabledLocales = useMemo(() => getEnabledProductLocales(value), [value]);

  function toggleLocale(nextLocale: string, enabled: boolean) {
    const nextEnabled = enabled
      ? [...new Set([...enabledLocales, nextLocale])]
      : enabledLocales.filter((entry) => entry !== nextLocale);

    if (nextEnabled.length === 0) {
      onChange(emptyDraft(defaultLocale));
      return;
    }

    onChange({
      name: Object.fromEntries(
        nextEnabled.map((entryLocale) => [
          entryLocale,
          value.name[entryLocale] ?? "",
        ]),
      ),
      description: Object.fromEntries(
        nextEnabled.map((entryLocale) => [
          entryLocale,
          value.description[entryLocale] ?? "",
        ]),
      ),
    });
  }

  function updateName(entryLocale: string, nextValue: string) {
    onChange({
      ...value,
      name: {
        ...value.name,
        [entryLocale]: nextValue,
      },
    });
  }

  function updateDescription(entryLocale: string, nextValue: string) {
    onChange({
      ...value,
      description: {
        ...value.description,
        [entryLocale]: nextValue,
      },
    });
  }

  return (
    <div className="space-y-4 rounded-2xl border border-border p-3">
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">
          {labels.languages}
        </p>
        <div className="flex flex-wrap gap-3">
          {localeOptions.map((option) => {
            const checked = enabledLocales.includes(option.value);

            return (
              <label
                key={option.value}
                className="inline-flex items-center gap-2 text-xs font-medium"
              >
                <Checkbox
                  checked={checked}
                  onCheckedChange={(nextChecked) =>
                    toggleLocale(option.value, nextChecked === true)
                  }
                />
                {option.label}
              </label>
            );
          })}
        </div>
      </div>

      <div className="space-y-4">
        {enabledLocales.map((entryLocale) => {
          const option = localeOptions.find(
            (candidate) => candidate.value === entryLocale,
          );
          const suffix = option?.label ?? entryLocale;
          const isDefault = entryLocale === defaultLocale;

          return (
            <div key={entryLocale} className="space-y-3">
              <Field>
                <FieldLabel className={isDefault ? "required" : undefined}>
                  {labels.name} ({suffix})
                </FieldLabel>
                <Input
                  value={value.name[entryLocale] ?? ""}
                  onChange={(event) =>
                    updateName(entryLocale, event.target.value)
                  }
                  placeholder={`${labels.namePlaceholder} (${suffix})`}
                  className="rounded-3xl"
                  autoFocus={entryLocale === locale}
                />
              </Field>

              <Field>
                <FieldLabel>
                  {labels.description} ({suffix})
                </FieldLabel>
                <Textarea
                  value={value.description[entryLocale] ?? ""}
                  onChange={(event) =>
                    updateDescription(entryLocale, event.target.value)
                  }
                  placeholder={`${labels.descriptionPlaceholder} (${suffix})`}
                  className="min-h-20 rounded-3xl"
                />
              </Field>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function createEmptyProductTranslations(
  locale: string = defaultLocale,
): MenuItemFieldTranslations {
  return emptyDraft(locale);
}
