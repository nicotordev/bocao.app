import { getDashboardContext } from "@/lib/dashboard/context";
import { PERMISSIONS } from "@/lib/rbac/permissions";

export async function requireAnalyticsAccess(restaurantId: string) {
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
    PERMISSIONS.ANALYTICS_READ,
  );

  if (!canRead) {
    return { ok: false as const, status: 403, error: "Forbidden" };
  }

  return { ok: true as const, context };
}
