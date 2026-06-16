import { z } from "zod";
import { defaultLocale } from "@/i18n/locales";
import { isValidContentLocaleCode } from "@/i18n/iso-languages";
import {
  extractCanonicalMenuItemFields,
  normalizeMenuItemTranslationInput,
} from "@/lib/menu/item-translations";

const localeSchema = z
  .string()
  .trim()
  .refine((value) => isValidContentLocaleCode(value));

export const menuItemTranslationsInputSchema = z.object({
  name: z
    .record(localeSchema, z.string().trim().min(1).max(120))
    .default({}),
  description: z
    .record(localeSchema, z.string().trim().max(500))
    .default({}),
});

export function parseMenuItemTranslationsInput(value: unknown) {
  const parsed = menuItemTranslationsInputSchema.safeParse(value);
  if (!parsed.success) {
    return { name: {}, description: {} };
  }

  return normalizeMenuItemTranslationInput(parsed.data);
}

export function validateMenuItemTranslations(
  translations: z.infer<typeof menuItemTranslationsInputSchema>,
) {
  const normalized = normalizeMenuItemTranslationInput(translations);
  const { name } = extractCanonicalMenuItemFields(normalized);

  if (!name) {
    return false;
  }

  return true;
}

export const menuItemTranslationsPayloadSchema =
  menuItemTranslationsInputSchema.superRefine((value, ctx) => {
    const normalized = normalizeMenuItemTranslationInput(value);
    const canonicalName = normalized.name[defaultLocale]?.trim();

    if (!canonicalName) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "DEFAULT_LOCALE_NAME_REQUIRED",
        path: ["name", defaultLocale],
      });
    }
  });
