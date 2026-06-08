import { getDashboardContext } from "@/lib/dashboard/context";
import { PERMISSIONS } from "@/lib/rbac/permissions";

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

export async function requireRestaurantWriteAccess(restaurantId: string) {
  const access = await requireRestaurantAccess(restaurantId);

  if (!access.ok) {
    return access;
  }

  const canWrite = access.context.membership.permissions.includes(
    PERMISSIONS.ORDERS_WRITE,
  );

  if (!canWrite) {
    return { ok: false as const, status: 403, error: "Forbidden" };
  }

  return access;
}
