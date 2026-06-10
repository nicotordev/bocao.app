import "server-only";

import { prisma } from "@/lib/prisma";

export async function loadUserMembershipsWithRestaurants(userId: string) {
  return prisma.membership.findMany({
    where: { userId },
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
    orderBy: { createdAt: "asc" },
  });
}

export type UserMembershipWithRestaurants = Awaited<
  ReturnType<typeof loadUserMembershipsWithRestaurants>
>[number];
