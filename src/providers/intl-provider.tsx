"use client";

import { NextIntlClientProvider } from "next-intl";
import type { ReactNode } from "react";
import type { AbstractIntlMessages } from "use-intl";
import type { Locale } from "@/i18n/locales";

type IntlProviderProps = {
  children: ReactNode;
  locale: Locale;
  messages: AbstractIntlMessages;
};

export function IntlProvider({
  children,
  locale,
  messages,
}: IntlProviderProps) {
  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
}
