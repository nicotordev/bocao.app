import { getDashboardContext } from "@/lib/dashboard/context";

export async function requireRestaurantAccess(restaurantId: string) {
  const context = await getDashboardContext();

  if (!context) {
    return { ok: false as const, status: 401, error: "Unauthorized" };
  }

  const allowed = context.restaurants.some(
    (restaurant) => restaurant.id === restaurantId,
  );

  if (!allowed) {
    return { ok: false as const, status: 403, error: "Forbidden" };
  }

  return { ok: true as const, context };
}
