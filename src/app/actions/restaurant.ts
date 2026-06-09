"use server";

import { getDashboardContext } from "@/lib/dashboard/context";
import {
  buildRestaurantLocaleOptions,
  updateRestaurantContentLocales,
} from "@/lib/restaurant/content-locales";
import { PERMISSIONS } from "@/lib/rbac/permissions";
import { z } from "zod";
import { isValidContentLocaleCode } from "@/i18n/iso-languages";

const updateContentLocalesSchema = z.object({
  restaurantId: z.string().cuid(),
  contentLocales: z
    .array(
      z
        .string()
        .trim()
        .refine((value) => isValidContentLocaleCode(value)),
    )
    .min(1),
  uiLocale: z.string().trim().optional(),
});

function requireMenuWrite(restaurantId: string) {
  return getDashboardContext().then((context) => {
    if (!context) {
      throw new Error("UNAUTHORIZED");
    }

    const allowed = context.restaurants.some(
      (restaurant) => restaurant.id === restaurantId,
    );

    if (!allowed) {
      throw new Error("FORBIDDEN");
    }

    const canWrite = context.membership.permissions.includes(
      PERMISSIONS.MENU_WRITE,
    );

    if (!canWrite) {
      throw new Error("FORBIDDEN");
    }

    return context;
  });
}

export async function updateRestaurantContentLocalesAction(input: {
  restaurantId: string;
  contentLocales: string[];
  uiLocale?: string;
}) {
  const parsed = updateContentLocalesSchema.safeParse(input);

  if (!parsed.success) {
    throw new Error("INVALID_INPUT");
  }

  const context = await requireMenuWrite(parsed.data.restaurantId);
  const contentLocales = await updateRestaurantContentLocales(
    parsed.data.restaurantId,
    parsed.data.contentLocales,
  );

  const localeOptions = buildRestaurantLocaleOptions(
    contentLocales,
    parsed.data.uiLocale ?? "es",
  );

  return { contentLocales, localeOptions };
}
