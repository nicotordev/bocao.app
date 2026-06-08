import { cookies } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { ACTIVE_RESTAURANT_COOKIE } from "@/lib/dashboard/constants";
import type { DashboardContext } from "@/lib/dashboard/types";
import {
  extractPermissionKeys,
  getNavigationForMembership,
} from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import type { SystemRoleSlug } from "@/lib/rbac/permissions";
import { headers } from "next/headers";

const restaurantCookieSchema = z.string().cuid();

function resolveActiveRestaurant(
  restaurants: DashboardContext["restaurants"],
  cookieValue: string | undefined,
) {
  const parsed = restaurantCookieSchema.safeParse(cookieValue);

  if (!parsed.success) {
    return restaurants[0] ?? null;
  }

  const match = restaurants.find(
    (restaurant) => restaurant.id === parsed.data,
  );

  return match ?? restaurants[0] ?? null;
}

export async function requireDashboardSession() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return session;
}

export async function hasUserMembership(userId: string): Promise<boolean> {
  const membership = await prisma.membership.findFirst({
    where: { userId },
    select: { id: true },
  });

  return membership !== null;
}

export async function getDashboardContext(): Promise<DashboardContext | null> {
  const session = await requireDashboardSession();

  if (!session) {
    return null;
  }

  const membership = await prisma.membership.findFirst({
    where: { userId: session.user.id },
    orderBy: { createdAt: "asc" },
    include: {
      organization: {
        include: {
          restaurants: {
            orderBy: { createdAt: "asc" },
          },
        },
      },
      role: {
        include: {
          rolePermissions: {
            include: {
              permission: {
                select: { key: true },
              },
            },
          },
        },
      },
    },
  });

  if (!membership) {
    return null;
  }

  const restaurants = membership.organization.restaurants.map((restaurant) => ({
    id: restaurant.id,
    name: restaurant.name,
    timezone: restaurant.timezone,
    currency: restaurant.currency,
    organizationId: restaurant.organizationId,
  }));

  const cookieStore = await cookies();
  const activeRestaurant = resolveActiveRestaurant(
    restaurants,
    cookieStore.get(ACTIVE_RESTAURANT_COOKIE)?.value,
  );

  const membershipWithPermissions = {
    ...membership,
    role: membership.role,
  };

  const permissions = extractPermissionKeys(membershipWithPermissions);

  return {
    user: {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      image: session.user.image ?? null,
    },
    organization: {
      id: membership.organization.id,
      name: membership.organization.name,
      slug: membership.organization.slug,
    },
    restaurants,
    activeRestaurant,
    membership: {
      id: membership.id,
      roleSlug: membership.role.slug as SystemRoleSlug,
      roleName: membership.role.name,
      permissions: Array.from(permissions),
    },
    navigation: getNavigationForMembership(membershipWithPermissions),
  };
}
