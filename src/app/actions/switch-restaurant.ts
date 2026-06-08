"use server";

import { getTranslations } from "next-intl/server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getDashboardContext } from "@/lib/dashboard/context";
import { ACTIVE_RESTAURANT_COOKIE } from "@/lib/dashboard/constants";

const switchRestaurantSchema = z.object({
  restaurantId: z.string().cuid(),
});

export type SwitchRestaurantResult =
  | { success: true }
  | { success: false; error: string };

export async function switchRestaurant(
  restaurantId: string,
): Promise<SwitchRestaurantResult> {
  const t = await getTranslations("actions.restaurant");

  const parsed = switchRestaurantSchema.safeParse({ restaurantId });

  if (!parsed.success) {
    return { success: false, error: t("invalid") };
  }

  const context = await getDashboardContext();

  if (!context) {
    return { success: false, error: t("invalidSession") };
  }

  const allowed = context.restaurants.some(
    (restaurant) => restaurant.id === parsed.data.restaurantId,
  );

  if (!allowed) {
    return { success: false, error: t("noAccess") };
  }

  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_RESTAURANT_COOKIE, parsed.data.restaurantId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  revalidatePath("/dashboard", "layout");

  return { success: true };
}
