"use client";

import { useMemo } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  createEmptyLocalizedLabel,
  getEnabledLocalesFromLabel,
} from "@/i18n/iso-languages";
import { defaultLocale } from "@/i18n/locales";
import type { LocalizedLabel } from "@/lib/product-flow/types";
import type { MenuLocaleOption } from "./types";

type FlowLocalizedFieldProps = {
  label: string;
  localeOptions: MenuLocaleOption[];
  value: LocalizedLabel;
  onChange: (value: LocalizedLabel) => void;
  multiline?: boolean;
  placeholder?: string;
  required?: boolean;
  languagesLabel?: string;
};

export function FlowLocalizedField({
  label,
  localeOptions,
  value,
  onChange,
  multiline = false,
  placeholder,
  required = false,
  languagesLabel,
}: FlowLocalizedFieldProps) {
  const InputComponent = multiline ? Textarea : Input;
  const enabledLocales = useMemo(
    () => getEnabledLocalesFromLabel(value, defaultLocale),
    [value],
  );

  function toggleLocale(locale: string, enabled: boolean) {
    const nextEnabled = enabled
      ? [...new Set([...enabledLocales, locale])]
      : enabledLocales.filter((entry) => entry !== locale);

    if (nextEnabled.length === 0) {
      onChange(createEmptyLocalizedLabel(defaultLocale));
      return;
    }

    onChange(
      Object.fromEntries(
        nextEnabled.map((entryLocale) => [
          entryLocale,
          value[entryLocale] ?? "",
        ]),
      ),
    );
  }

  function updateLocaleValue(locale: string, nextValue: string) {
    onChange({
      ...value,
      [locale]: nextValue,
    });
  }

  return (
    <div className="space-y-3 rounded-2xl border border-border p-3">
      <p className="text-sm font-medium">
        {label}
        {required ? <span className="text-destructive"> *</span> : null}
      </p>

      <div className="space-y-2">
        {languagesLabel ? (
          <p className="text-xs font-medium text-muted-foreground">
            {languagesLabel}
          </p>
        ) : null}
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

      <div className="space-y-2">
        {enabledLocales.map((entryLocale) => {
          const option = localeOptions.find(
            (candidate) => candidate.value === entryLocale,
          );
          const suffix = option?.label ?? entryLocale.toUpperCase();

          return (
            <div key={entryLocale} className="space-y-1">
              <p className="text-xs text-muted-foreground">{suffix}</p>
              <InputComponent
                value={value[entryLocale] ?? ""}
                onChange={(event) =>
                  updateLocaleValue(entryLocale, event.target.value)
                }
                placeholder={
                  placeholder
                    ? `${placeholder} (${suffix})`
                    : entryLocale === defaultLocale
                      ? placeholder
                      : undefined
                }
                className="rounded-2xl"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
