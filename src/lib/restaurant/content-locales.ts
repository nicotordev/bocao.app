import {
  buildContentLocaleOptions,
  normalizeContentLocaleCodes,
} from "@/i18n/iso-languages";
import { defaultLocale } from "@/i18n/locales";
import { prisma } from "@/lib/prisma";

export const DEFAULT_CONTENT_LOCALES = [defaultLocale, "en"];

export async function getRestaurantContentLocales(restaurantId: string) {
  const restaurant = await prisma.restaurant.findUnique({
    where: { id: restaurantId },
    select: { contentLocales: true },
  });

  const locales = normalizeContentLocaleCodes(
    restaurant?.contentLocales?.length
      ? restaurant.contentLocales
      : DEFAULT_CONTENT_LOCALES,
  );

  return locales.length > 0 ? locales : DEFAULT_CONTENT_LOCALES;
}

export async function updateRestaurantContentLocales(
  restaurantId: string,
  contentLocales: string[],
) {
  const normalized = normalizeContentLocaleCodes(contentLocales);

  if (normalized.length === 0) {
    throw new Error("At least one content locale is required");
  }

  const restaurant = await prisma.restaurant.update({
    where: { id: restaurantId },
    data: { contentLocales: normalized },
    select: {
      id: true,
      contentLocales: true,
    },
  });

  return normalizeContentLocaleCodes(restaurant.contentLocales);
}

export function buildRestaurantLocaleOptions(
  contentLocales: string[],
  uiLocale: string,
) {
  return buildContentLocaleOptions(contentLocales, uiLocale);
}
