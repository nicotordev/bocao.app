"use client";

import { NextIntlClientProvider } from "next-intl";
import type { ReactNode } from "react";
import type { AbstractIntlMessages } from "use-intl";
import type { Locale } from "@/i18n/locales";

type IntlProviderProps = {
  children: ReactNode;
  locale: Locale;
  messages: AbstractIntlMessages;
  timeZone: string;
};

export function IntlProvider({
  children,
  locale,
  messages,
  timeZone,
}: IntlProviderProps) {
  return (
    <NextIntlClientProvider
      locale={locale}
      messages={messages}
      timeZone={timeZone}
    >
      {children}
    </NextIntlClientProvider>
  );
}
