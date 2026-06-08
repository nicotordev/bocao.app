import { getAdminEmailPatterns, matchesAdminEmail } from "@/lib/admin-emails";
import { DEMO_ORGANIZATION_SLUG } from "@/lib/demo/constants";
import { prisma } from "@/lib/prisma";
import { seedOrganizationRoles } from "@/lib/rbac/seed-organization-roles";
import { SYSTEM_ROLE_SLUGS } from "@/lib/rbac/permissions";

export async function ensureDemoAdminMembershipForUser(
  userId: string,
  email: string,
): Promise<boolean> {
  const patterns = getAdminEmailPatterns();

  if (!patterns || !matchesAdminEmail(email, patterns)) {
    return false;
  }

  const organization = await prisma.organization.findUnique({
    where: { slug: DEMO_ORGANIZATION_SLUG },
    select: { id: true },
  });

  if (!organization) {
    return false;
  }

  const existingMembership = await prisma.membership.findUnique({
    where: {
      userId_organizationId: {
        userId,
        organizationId: organization.id,
      },
    },
    select: { id: true },
  });

  if (existingMembership) {
    return true;
  }

  const rolesBySlug = await seedOrganizationRoles(prisma, organization.id);
  const ownerRoleId = rolesBySlug[SYSTEM_ROLE_SLUGS.OWNER];

  if (!ownerRoleId) {
    return false;
  }

  await prisma.membership.create({
    data: {
      userId,
      organizationId: organization.id,
      roleId: ownerRoleId,
    },
  });

  return true;
}
