"use server";

import { revalidatePath } from "next/cache";
import { getDashboardContext } from "@/lib/dashboard/context";
import { toPrismaBusinessType } from "@/lib/settings/mappers";
import { updateRestaurantProfileSchema } from "@/lib/settings/schema";
import { prisma } from "@/lib/prisma";
import { PERMISSIONS } from "@/lib/rbac/permissions";

export type UpdateRestaurantProfileResult =
  | { success: true }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> };

async function requireSettingsWrite(restaurantId: string) {
  const context = await getDashboardContext();

  if (!context) {
    throw new Error("UNAUTHORIZED");
  }

  const allowed = context.restaurants.some(
    (restaurant) => restaurant.id === restaurantId,
  );

  if (!allowed) {
    throw new Error("FORBIDDEN");
  }

  const canWrite = context.membership.permissions.includes(
    PERMISSIONS.SETTINGS_WRITE,
  );

  if (!canWrite) {
    throw new Error("FORBIDDEN");
  }

  return context;
}

export async function updateRestaurantProfileAction(
  input: unknown,
): Promise<UpdateRestaurantProfileResult> {
  const parsed = updateRestaurantProfileSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      error: "INVALID_INPUT",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    const context = await requireSettingsWrite(parsed.data.restaurantId);

    await prisma.$transaction(async (tx) => {
      await tx.restaurant.update({
        where: {
          id: parsed.data.restaurantId,
          organizationId: context.organization.id,
        },
        data: {
          name: parsed.data.name,
          businessType: toPrismaBusinessType(parsed.data.businessType),
          phone: parsed.data.phone || null,
          city: parsed.data.city || null,
          timezone: parsed.data.timezone,
          currency: parsed.data.currency,
        },
      });

      await tx.organization.update({
        where: { id: context.organization.id },
        data: {
          country: parsed.data.country,
        },
      });
    });

    revalidatePath("/dashboard/settings");

    return { success: true };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }

    return { success: false, error: "UNKNOWN_ERROR" };
  }
}
