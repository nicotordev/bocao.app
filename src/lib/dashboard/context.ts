import { cookies } from "next/headers";
import { headers } from "next/headers";
import { cache } from "react";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { ACTIVE_RESTAURANT_COOKIE } from "@/lib/dashboard/constants";
import { loadUserMembershipsWithRestaurants } from "@/lib/dashboard/memberships";
import type { DashboardContext } from "@/lib/dashboard/types";
import {
  extractPermissionKeys,
  getNavigationForMembership,
} from "@/lib/permissions";
import { ensureDemoAdminMembershipForUser } from "@/lib/demo/ensure-admin-membership";
import { prisma } from "@/lib/prisma";
import type { SystemRoleSlug } from "@/lib/rbac/permissions";
import { syncTeamRolesForOrganization } from "@/lib/team/sync-roles";
import { userNeedsProfileName } from "@/lib/user-profile";

const restaurantCookieSchema = z.string().cuid();

function resolveUserDisplayName(
  name: string | null | undefined,
  email: string,
) {
  const trimmedName = name?.trim();
  if (trimmedName && trimmedName.length > 0) {
    return trimmedName;
  }

  const trimmedEmail = email.trim();
  if (trimmedEmail.length > 0) {
    return trimmedEmail;
  }

  return "System";
}

function mapRestaurant(
  restaurant: {
    id: string;
    name: string;
    timezone: string;
    currency: string;
    organizationId: string;
    contentLocales: string[];
  },
  organizationName: string,
) {
  return {
    id: restaurant.id,
    name: restaurant.name,
    timezone: restaurant.timezone,
    currency: restaurant.currency,
    organizationId: restaurant.organizationId,
    contentLocales: restaurant.contentLocales,
    organizationName,
  };
}

function resolveActiveRestaurant(
  restaurants: DashboardContext["restaurants"],
  cookieValue: string | undefined,
) {
  const parsed = restaurantCookieSchema.safeParse(cookieValue);

  if (!parsed.success) {
    return restaurants[0] ?? null;
  }

  const match = restaurants.find((restaurant) => restaurant.id === parsed.data);

  return match ?? restaurants[0] ?? null;
}

export const requireDashboardSession = cache(
  async function requireDashboardSession() {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    return session;
  },
);

export async function hasUserMembership(userId: string): Promise<boolean> {
  const memberships = await loadUserMembershipsWithRestaurants(userId);

  return memberships.length > 0;
}

export const getDashboardContext = cache(
  async function getDashboardContext(): Promise<DashboardContext | null> {
    const session = await requireDashboardSession();

    if (!session) {
      return null;
    }

    let memberships = await loadUserMembershipsWithRestaurants(session.user.id);

    if (memberships.length === 0) {
      const attached = await ensureDemoAdminMembershipForUser(
        session.user.id,
        session.user.email,
      );

      if (!attached) {
        return null;
      }

      memberships = await loadUserMembershipsWithRestaurants(session.user.id);
    }

    if (memberships.length === 0) {
      return null;
    }

    const organizationIds = [
      ...new Set(memberships.map((membership) => membership.organizationId)),
    ];
    await Promise.all(
      organizationIds.map((organizationId) =>
        syncTeamRolesForOrganization(prisma, organizationId),
      ),
    );
    memberships = await loadUserMembershipsWithRestaurants(session.user.id);

    const organizations = memberships.map((membership) => ({
      id: membership.organization.id,
      name: membership.organization.name,
      restaurants: membership.organization.restaurants.map((restaurant) =>
        mapRestaurant(restaurant, membership.organization.name),
      ),
    }));

    const restaurants = organizations.flatMap(
      (organization) => organization.restaurants,
    );

    const cookieStore = await cookies();
    const activeRestaurant = resolveActiveRestaurant(
      restaurants,
      cookieStore.get(ACTIVE_RESTAURANT_COOKIE)?.value,
    );

    const activeMembership =
      memberships.find(
        (membership) =>
          membership.organizationId === activeRestaurant?.organizationId,
      ) ?? memberships[0]!;

    const membershipWithPermissions = {
      ...activeMembership,
      role: activeMembership.role,
    };

    const permissions = extractPermissionKeys(membershipWithPermissions);

    const userRecord = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true },
    });
    const rawUserName = userRecord?.name ?? session.user.name;
    const needsProfileName = userNeedsProfileName(
      rawUserName,
      session.user.email,
    );

    return {
      user: {
        id: session.user.id,
        name: needsProfileName
          ? (rawUserName?.trim() ?? "")
          : resolveUserDisplayName(rawUserName, session.user.email),
        email: session.user.email,
        image: session.user.image ?? null,
        needsProfileName,
      },
      organization: {
        id: activeMembership.organization.id,
        name: activeMembership.organization.name,
        slug: activeMembership.organization.slug,
      },
      organizations,
      restaurants,
      activeRestaurant,
      membership: {
        id: activeMembership.id,
        roleSlug: activeMembership.role.slug as SystemRoleSlug,
        roleName: activeMembership.role.name,
        permissions: Array.from(permissions),
      },
      navigation: getNavigationForMembership(membershipWithPermissions),
    };
  },
);
