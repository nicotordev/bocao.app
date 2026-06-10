import "server-only";

import { requireDashboardSession } from "@/lib/dashboard/context";
import {
  loadUserMembershipsWithRestaurants,
  type UserMembershipWithRestaurants,
} from "@/lib/dashboard/memberships";
import { membershipHasPermission } from "@/lib/rbac/can";
import { PERMISSIONS } from "@/lib/rbac/permissions";

type MembershipWithOrg = UserMembershipWithRestaurants;

function membershipHasCustomersRead(membership: MembershipWithOrg) {
  return (
    membershipHasPermission(membership, PERMISSIONS.CUSTOMERS_READ) ||
    membershipHasPermission(membership, PERMISSIONS.CUSTOMERS_WRITE)
  );
}

function membershipHasCustomersWrite(membership: MembershipWithOrg) {
  return membershipHasPermission(membership, PERMISSIONS.CUSTOMERS_WRITE);
}

export async function requireCustomersImportWriteAccess(restaurantId: string) {
  const session = await requireDashboardSession();

  if (!session) {
    return { ok: false as const, status: 401, error: "Unauthorized" };
  }

  const memberships = await loadUserMembershipsWithRestaurants(session.user.id);
  const targetMembership = memberships.find((membership) =>
    membership.organization.restaurants.some(
      (restaurant) => restaurant.id === restaurantId,
    ),
  );

  if (!targetMembership || !membershipHasCustomersWrite(targetMembership)) {
    return { ok: false as const, status: 403, error: "Forbidden" };
  }

  return {
    ok: true as const,
    userId: session.user.id,
    membership: targetMembership,
  };
}

export async function resolveAccessibleSourceRestaurantIds(
  userId: string,
  excludeRestaurantId: string,
): Promise<string[]> {
  const memberships = await loadUserMembershipsWithRestaurants(userId);
  const restaurantIds = new Set<string>();

  for (const membership of memberships) {
    if (!membershipHasCustomersRead(membership)) {
      continue;
    }

    for (const restaurant of membership.organization.restaurants) {
      if (restaurant.id !== excludeRestaurantId) {
        restaurantIds.add(restaurant.id);
      }
    }
  }

  return Array.from(restaurantIds);
}

export async function assertSourceRestaurantsAccessible(
  userId: string,
  restaurantIds: string[],
): Promise<boolean> {
  if (restaurantIds.length === 0) {
    return true;
  }

  const accessibleIds = new Set(
    await resolveAccessibleSourceRestaurantIds(userId, ""),
  );

  return restaurantIds.every((restaurantId) => accessibleIds.has(restaurantId));
}
