import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import {
  isTeamRole,
  TEAM_ROLE_DEFINITIONS,
  teamPermissionsToRbacKeys,
  type TeamPermission,
  type TeamRole,
} from "@/lib/team/permissions";
import type { InvitationStatus, MembershipStatus } from "@/lib/team/types";

const membershipInclude = {
  user: {
    select: {
      id: true,
      name: true,
      email: true,
      sessions: {
        select: { updatedAt: true },
        orderBy: { updatedAt: "desc" as const },
        take: 1,
      },
    },
  },
  role: {
    select: {
      id: true,
      slug: true,
      name: true,
    },
  },
  restaurantMemberships: {
    select: {
      restaurantId: true,
    },
  },
} satisfies Prisma.MembershipInclude;

export async function ensureTeamRolesForOrganization(organizationId: string) {
  const permissions = await prisma.permission.findMany({
    select: { id: true, key: true },
  });

  const permissionByKey = new Map(
    permissions.map((permission) => [permission.key, permission.id]),
  );

  const rolesBySlug: Record<string, string> = {};

  for (const definition of TEAM_ROLE_DEFINITIONS) {
    const role = await prisma.role.upsert({
      where: {
        organizationId_slug: {
          organizationId,
          slug: definition.slug,
        },
      },
      update: {
        name: definition.name,
        description: definition.description,
        isSystem: true,
      },
      create: {
        organizationId,
        slug: definition.slug,
        name: definition.name,
        description: definition.description,
        isSystem: true,
      },
      select: { id: true, slug: true },
    });

    rolesBySlug[role.slug] = role.id;

    const rbacKeys = teamPermissionsToRbacKeys(definition.permissions);
    const permissionIds = rbacKeys
      .map((key) => permissionByKey.get(key))
      .filter((id): id is string => id !== undefined);

    await prisma.rolePermission.deleteMany({
      where: { roleId: role.id },
    });

    if (permissionIds.length > 0) {
      await prisma.rolePermission.createMany({
        data: permissionIds.map((permissionId) => ({
          roleId: role.id,
          permissionId,
        })),
        skipDuplicates: true,
      });
    }
  }

  return rolesBySlug;
}

export async function findRoleIdBySlug(
  organizationId: string,
  slug: TeamRole,
): Promise<string | null> {
  const role = await prisma.role.findUnique({
    where: {
      organizationId_slug: {
        organizationId,
        slug,
      },
    },
    select: { id: true },
  });

  return role?.id ?? null;
}

export async function listOrganizationRestaurants(organizationId: string) {
  return prisma.restaurant.findMany({
    where: { organizationId },
    select: { id: true, name: true },
    orderBy: { createdAt: "asc" },
  });
}

export async function listOrganizationMembers(organizationId: string) {
  return prisma.membership.findMany({
    where: {
      organizationId,
      status: { not: "removed" },
    },
    include: membershipInclude,
    orderBy: { createdAt: "asc" },
  });
}

export async function listPendingInvitations(organizationId: string) {
  const now = new Date();

  return prisma.teamInvitation.findMany({
    where: {
      organizationId,
      status: "pending",
      expiresAt: { gt: now },
    },
    include: {
      invitedBy: {
        select: {
          id: true,
          user: {
            select: { name: true },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function findMembershipById(
  membershipId: string,
  organizationId: string,
) {
  return prisma.membership.findFirst({
    where: { id: membershipId, organizationId },
    include: membershipInclude,
  });
}

export async function findActiveMemberByEmail(
  organizationId: string,
  email: string,
) {
  return prisma.membership.findFirst({
    where: {
      organizationId,
      status: "active",
      user: {
        email: email.toLowerCase(),
      },
    },
    select: { id: true },
  });
}

export async function findPendingInvitationByEmail(
  organizationId: string,
  email: string,
) {
  const now = new Date();

  return prisma.teamInvitation.findFirst({
    where: {
      organizationId,
      email: email.toLowerCase(),
      status: "pending",
      expiresAt: { gt: now },
    },
    select: { id: true },
  });
}

export async function countOwnersInOrganization(organizationId: string) {
  return prisma.membership.count({
    where: {
      organizationId,
      status: "active",
      role: { slug: "owner" },
    },
  });
}

export function parseCustomPermissions(value: unknown): TeamPermission[] | null {
  if (!Array.isArray(value)) {
    return null;
  }

  const permissions = value.filter(
    (item): item is TeamPermission => typeof item === "string",
  );

  return permissions.length > 0 ? permissions : null;
}

export function mapMembershipStatus(status: string): MembershipStatus {
  if (status === "inactive" || status === "removed") {
    return status;
  }

  return "active";
}

export function mapInvitationStatus(
  status: string,
  expiresAt: Date,
): InvitationStatus {
  if (status === "accepted" || status === "revoked") {
    return status;
  }

  if (expiresAt.getTime() <= Date.now()) {
    return "expired";
  }

  return status === "pending" ? "pending" : "expired";
}

export function resolveDisplayRole(slug: string): TeamRole | "staff" {
  if (isTeamRole(slug)) {
    return slug;
  }

  if (slug === "staff") {
    return "staff";
  }

  return "viewer";
}

export async function syncRestaurantMemberships(
  tx: Prisma.TransactionClient,
  input: {
    organizationId: string;
    membershipId: string;
    restaurantIds: string[];
    role?: TeamRole | null;
    permissions?: TeamPermission[] | null;
  },
) {
  await tx.restaurantMembership.deleteMany({
    where: { membershipId: input.membershipId },
  });

  if (input.restaurantIds.length === 0) {
    return;
  }

  await tx.restaurantMembership.createMany({
    data: input.restaurantIds.map((restaurantId) => ({
      organizationId: input.organizationId,
      restaurantId,
      membershipId: input.membershipId,
      role: input.role ?? null,
      permissions: input.permissions ?? undefined,
    })),
  });
}

export async function getRestaurantNamesByIds(
  organizationId: string,
  restaurantIds: string[],
) {
  if (restaurantIds.length === 0) {
    return new Map<string, string>();
  }

  const restaurants = await prisma.restaurant.findMany({
    where: {
      organizationId,
      id: { in: restaurantIds },
    },
    select: { id: true, name: true },
  });

  return new Map(restaurants.map((restaurant) => [restaurant.id, restaurant.name]));
}
