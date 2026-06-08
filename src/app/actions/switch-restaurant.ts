"use server";

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
  const parsed = switchRestaurantSchema.safeParse({ restaurantId });

  if (!parsed.success) {
    return { success: false, error: "Restaurante inválido" };
  }

  const context = await getDashboardContext();

  if (!context) {
    return { success: false, error: "Sesión no válida" };
  }

  const allowed = context.restaurants.some(
    (restaurant) => restaurant.id === parsed.data.restaurantId,
  );

  if (!allowed) {
    return { success: false, error: "No tienes acceso a este restaurante" };
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
