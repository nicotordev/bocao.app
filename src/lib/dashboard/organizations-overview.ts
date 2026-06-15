import "server-only";

import { startOfDay } from "date-fns";
import { loadUserMembershipsWithRestaurants } from "@/lib/dashboard/memberships";
import { formatCurrency } from "@/lib/orders/currency";
import { prisma } from "@/lib/prisma";
import { PERMISSIONS, SYSTEM_ROLE_SLUGS } from "@/lib/rbac/permissions";

export type OrganizationOverviewRestaurant = {
  id: string;
  name: string;
  city: string | null;
  currency: string;
  timezone: string;
};

export type OrganizationOverviewItem = {
  id: string;
  name: string;
  slug: string;
  roleName: string;
  canCreateRestaurant: boolean;
  restaurantCount: number;
  customerCount: number;
  activeOrders: number;
  todayRevenueCents: number;
  todayRevenue: string;
  currency: string;
  restaurants: OrganizationOverviewRestaurant[];
};

export type OrganizationsOverviewData = {
  organizations: OrganizationOverviewItem[];
  totals: {
    organizations: number;
    restaurants: number;
    customers: number;
    activeOrders: number;
  };
};

async function buildOrganizationOverview(
  membership: Awaited<
    ReturnType<typeof loadUserMembershipsWithRestaurants>
  >[number],
): Promise<OrganizationOverviewItem> {
  const restaurants = membership.organization.restaurants;
  const restaurantIds = restaurants.map((restaurant) => restaurant.id);
  const primaryCurrency = restaurants[0]?.currency ?? "CLP";
  const todayStart = startOfDay(new Date());

  const [customerCount, activeOrders, revenue] = await Promise.all([
    restaurantIds.length > 0
      ? prisma.customer.count({
          where: { restaurantId: { in: restaurantIds } },
        })
      : Promise.resolve(0),
    restaurantIds.length > 0
      ? prisma.order.count({
          where: {
            restaurantId: { in: restaurantIds },
            status: { notIn: ["COMPLETED", "CANCELLED"] },
          },
        })
      : Promise.resolve(0),
    restaurantIds.length > 0
      ? prisma.order.aggregate({
          where: {
            restaurantId: { in: restaurantIds },
            status: "COMPLETED",
            createdAt: { gte: todayStart },
          },
          _sum: { totalCents: true },
        })
      : Promise.resolve({ _sum: { totalCents: null } }),
  ]);

  const todayRevenueCents = revenue._sum.totalCents ?? 0;
  const rolePermissions = membership.role.rolePermissions.map(
    (rolePermission) => rolePermission.permission.key,
  );
  const canCreateRestaurant =
    membership.role.slug === SYSTEM_ROLE_SLUGS.OWNER ||
    rolePermissions.includes(PERMISSIONS.RESTAURANT_WRITE) ||
    rolePermissions.includes(PERMISSIONS.SETTINGS_WRITE);

  return {
    id: membership.organization.id,
    name: membership.organization.name,
    slug: membership.organization.slug,
    roleName: membership.role.name,
    canCreateRestaurant,
    restaurantCount: restaurants.length,
    customerCount,
    activeOrders,
    todayRevenueCents,
    todayRevenue: formatCurrency(todayRevenueCents, primaryCurrency),
    currency: primaryCurrency,
    restaurants: restaurants.map((restaurant) => ({
      id: restaurant.id,
      name: restaurant.name,
      city: restaurant.city,
      currency: restaurant.currency,
      timezone: restaurant.timezone,
    })),
  };
}

export async function getOrganizationsOverview(
  userId: string,
): Promise<OrganizationsOverviewData> {
  const memberships = await loadUserMembershipsWithRestaurants(userId);
  const organizations = await Promise.all(
    memberships.map((membership) => buildOrganizationOverview(membership)),
  );

  return {
    organizations,
    totals: {
      organizations: organizations.length,
      restaurants: organizations.reduce(
        (sum, organization) => sum + organization.restaurantCount,
        0,
      ),
      customers: organizations.reduce(
        (sum, organization) => sum + organization.customerCount,
        0,
      ),
      activeOrders: organizations.reduce(
        (sum, organization) => sum + organization.activeOrders,
        0,
      ),
    },
  };
}
