"use client";

import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { setLocale } from "@/app/actions/locale";
import { localeLabels } from "@/i18n/locale-labels";
import { type Locale, locales } from "@/i18n/locales";
import { cn } from "@/lib/utils";

type OnboardingLocalePickerProps = {
  disabled?: boolean;
};

export function OnboardingLocalePicker({
  disabled = false,
}: OnboardingLocalePickerProps) {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleSelect(nextLocale: Locale) {
    if (nextLocale === locale || isPending || disabled) {
      return;
    }

    startTransition(async () => {
      await setLocale(nextLocale);
      router.refresh();
    });
  }

  return (
    <div className="grid grid-cols-2 gap-2">
      {locales.map((code) => {
        const selected = locale === code;

        return (
          <button
            key={code}
            type="button"
            disabled={disabled || isPending}
            onClick={() => handleSelect(code)}
            className={cn(
              "rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors",
              selected
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border hover:bg-muted/40",
              (disabled || isPending) && "pointer-events-none opacity-60",
            )}
          >
            {localeLabels[code]}
          </button>
        );
      })}
    </div>
  );
}
