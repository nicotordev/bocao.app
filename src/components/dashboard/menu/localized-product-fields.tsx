"use client";

import { useLocale } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { defaultLocale, type Locale } from "@/i18n/locales";
import type { MenuItemFieldTranslations } from "@/lib/menu/item-translations";
import type { MenuLocaleOption } from "./types";

/** Beyond this count, tabs overflow the product dialog — use a select instead. */
const LOCALE_TABS_THRESHOLD = 4;

export type LocalizedProductFieldsLabels = {
  languages: string;
  name: string;
  namePlaceholder: string;
  description: string;
  descriptionPlaceholder: string;
  languagePlaceholder: string;
  customLanguage: string;
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
  const displayLocales = useMemo(() => {
    const options = [...localeOptions];

    for (const entryLocale of enabledLocales) {
      if (options.some((option) => option.value === entryLocale)) {
        continue;
      }

      options.push({
        value: entryLocale,
        label: `${entryLocale.toUpperCase()} (${labels.customLanguage})`,
      });
    }

    return options.length > 0
      ? options
      : [{ value: defaultLocale, label: defaultLocale.toUpperCase() }];
  }, [enabledLocales, labels.customLanguage, localeOptions]);
  const initialLocale =
    displayLocales.find((option) => option.value === locale)?.value ??
    displayLocales.find((option) => option.value === defaultLocale)?.value ??
    displayLocales[0]?.value ??
    defaultLocale;
  const [activeLocale, setActiveLocale] = useState(initialLocale);
  const useSelectPicker = displayLocales.length > LOCALE_TABS_THRESHOLD;
  const activeOption =
    displayLocales.find((option) => option.value === activeLocale) ??
    displayLocales[0];
  const entryLocale = activeOption?.value ?? defaultLocale;
  const suffix = activeOption?.label ?? entryLocale;
  const isDefault = entryLocale === defaultLocale;

  useEffect(() => {
    if (!displayLocales.some((option) => option.value === activeLocale)) {
      setActiveLocale(initialLocale);
    }
  }, [activeLocale, displayLocales, initialLocale]);

  const localeSelect = (
    <Select value={entryLocale} onValueChange={setActiveLocale}>
      <SelectTrigger className="w-full rounded-2xl">
        <SelectValue placeholder={labels.languagePlaceholder} />
      </SelectTrigger>
      <SelectContent>
        {displayLocales.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

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
        {useSelectPicker ? (
          localeSelect
        ) : (
          <>
            <Tabs value={entryLocale} onValueChange={setActiveLocale}>
              <TabsList
                variant="line"
                className="hidden h-auto w-full max-w-full flex-nowrap justify-start overflow-x-auto rounded-2xl border border-border/50 bg-muted/20 p-1 sm:flex"
              >
                {displayLocales.map((option) => (
                  <TabsTrigger
                    key={option.value}
                    value={option.value}
                    title={option.label}
                    className="flex-none shrink-0 rounded-xl px-3 py-2 text-xs"
                  >
                    {option.value.toUpperCase()}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
            <div className="sm:hidden">{localeSelect}</div>
          </>
        )}
      </div>

      <div className="space-y-4">
        <div key={entryLocale} className="space-y-3">
          <Field>
            <FieldLabel className={isDefault ? "required" : undefined}>
              {labels.name} ({suffix})
            </FieldLabel>
            <Input
              value={value.name[entryLocale] ?? ""}
              onChange={(event) => updateName(entryLocale, event.target.value)}
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
      </div>
    </div>
  );
}

export function createEmptyProductTranslations(
  locale: string = defaultLocale,
): MenuItemFieldTranslations {
  return emptyDraft(locale);
}
