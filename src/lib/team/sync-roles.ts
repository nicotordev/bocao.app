import type { PrismaClient } from "@/generated/prisma/client";
import {
  TEAM_ROLE_DEFINITIONS,
  teamPermissionsToRbacKeys,
} from "@/lib/team/permissions";

type Db = Pick<PrismaClient, "permission" | "role" | "rolePermission" | "organization">;

export async function syncTeamRolesForOrganization(db: Db, organizationId: string) {
  const permissions = await db.permission.findMany({
    select: { id: true, key: true },
  });

  const permissionByKey = new Map(
    permissions.map((permission) => [permission.key, permission.id]),
  );

  const rolesBySlug: Record<string, string> = {};

  for (const definition of TEAM_ROLE_DEFINITIONS) {
    const role = await db.role.upsert({
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

    await db.rolePermission.deleteMany({
      where: { roleId: role.id },
    });

    if (permissionIds.length > 0) {
      await db.rolePermission.createMany({
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

export async function syncAllTeamRoles(db: Db) {
  const organizations = await db.organization.findMany({
    select: { id: true },
  });

  for (const organization of organizations) {
    await syncTeamRolesForOrganization(db, organization.id);
  }

  return organizations.length;
}
