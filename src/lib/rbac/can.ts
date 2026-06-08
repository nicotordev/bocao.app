import type { PrismaClient } from "@/generated/prisma/client";
import type { PermissionKey } from "@/lib/rbac/permissions";
import { SYSTEM_ROLE_SLUGS } from "@/lib/rbac/permissions";

type Db = Pick<PrismaClient, "membership">;

export async function getMembershipWithPermissions(
  db: Db,
  userId: string,
  organizationId: string,
) {
  return db.membership.findUnique({
    where: {
      userId_organizationId: { userId, organizationId },
    },
    include: {
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
}

export function membershipHasPermission(
  membership: Awaited<ReturnType<typeof getMembershipWithPermissions>>,
  permission: PermissionKey,
) {
  if (!membership) {
    return false;
  }

  if (membership.role.slug === SYSTEM_ROLE_SLUGS.OWNER) {
    return true;
  }

  return membership.role.rolePermissions.some(
    (rolePermission) => rolePermission.permission.key === permission,
  );
}

export async function can(
  db: Db,
  userId: string,
  organizationId: string,
  permission: PermissionKey,
) {
  const membership = await getMembershipWithPermissions(
    db,
    userId,
    organizationId,
  );

  return membershipHasPermission(membership, permission);
}
