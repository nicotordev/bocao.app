import type { PrismaClient } from "../../src/generated/prisma/client";
import {
  getAdminEmailPatterns,
  matchesAdminEmail,
} from "../../src/lib/admin-emails";
import { SYSTEM_ROLE_SLUGS } from "../../src/lib/rbac/permissions";

export async function ensureDemoAdminMemberships(
  prisma: PrismaClient,
  organizationId: string,
): Promise<number> {
  const patterns = getAdminEmailPatterns();

  if (!patterns) {
    console.log("ADMIN_EMAILS not set — skipping demo owner memberships");
    return 0;
  }

  const ownerRole = await prisma.role.findFirst({
    where: {
      organizationId,
      slug: SYSTEM_ROLE_SLUGS.OWNER,
    },
    select: { id: true },
  });

  if (!ownerRole) {
    throw new Error("Owner role not found for demo organization");
  }

  const users = await prisma.user.findMany({
    select: { id: true, email: true },
  });

  let attached = 0;

  for (const user of users) {
    if (!matchesAdminEmail(user.email, patterns)) {
      continue;
    }

    await prisma.membership.upsert({
      where: {
        userId_organizationId: {
          userId: user.id,
          organizationId,
        },
      },
      update: {
        roleId: ownerRole.id,
      },
      create: {
        userId: user.id,
        organizationId,
        roleId: ownerRole.id,
      },
    });

    attached += 1;
    console.log(`Attached demo owner membership for ${user.email}`);
  }

  return attached;
}
