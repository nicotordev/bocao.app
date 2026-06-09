import { getDashboardContext } from "@/lib/dashboard/context";
import { PERMISSIONS } from "@/lib/rbac/permissions";

export async function requireRestaurantCustomersAccess(restaurantId: string) {
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

  const canRead = context.membership.permissions.includes(
    PERMISSIONS.CUSTOMERS_READ,
  );

  if (!canRead) {
    return { ok: false as const, status: 403, error: "Forbidden" };
  }

  return { ok: true as const, context };
}

export async function requireRestaurantCustomersWriteAccess(
  restaurantId: string,
) {
  const access = await requireRestaurantCustomersAccess(restaurantId);

  if (!access.ok) {
    return access;
  }

  const canWrite = access.context.membership.permissions.includes(
    PERMISSIONS.CUSTOMERS_WRITE,
  );

  if (!canWrite) {
    return { ok: false as const, status: 403, error: "Forbidden" };
  }

  return access;
}
