import type en from "@/i18n/messages/en.json";
import { locales } from "@/i18n/locales";

declare module "next-intl" {
  interface AppConfig {
    Locale: (typeof locales)[number];
    Messages: typeof en;
  }
}
