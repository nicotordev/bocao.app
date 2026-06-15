"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { getTranslations } from "next-intl/server";
import { z } from "zod";
import { ACTIVE_RESTAURANT_COOKIE } from "@/lib/dashboard/constants";
import { getDashboardContext } from "@/lib/dashboard/context";
import { CURRENCY_OPTIONS, TIMEZONE_OPTIONS } from "@/lib/onboarding/countries";
import { businessTypeSchema } from "@/lib/onboarding/schema";
import { prisma } from "@/lib/prisma";
import { PERMISSIONS, SYSTEM_ROLE_SLUGS } from "@/lib/rbac/permissions";

const currencyCodes = [...CURRENCY_OPTIONS] as [string, ...string[]];
const timezoneCodes = [...TIMEZONE_OPTIONS] as [string, ...string[]];

const createRestaurantSchema = z.object({
  organizationId: z.string().cuid(),
  name: z.string().trim().min(2).max(80),
  city: z.string().trim().max(80).optional().or(z.literal("")),
  timezone: z.enum(timezoneCodes),
  currency: z.enum(currencyCodes),
  businessType: businessTypeSchema.optional(),
});

export type CreateRestaurantInput = z.infer<typeof createRestaurantSchema>;

export type CreateRestaurantResult =
  | { success: true; restaurantId: string }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> };

export async function createRestaurantAction(
  input: unknown,
): Promise<CreateRestaurantResult> {
  const t = await getTranslations("dashboard.organizations.createDialog");
  const tActions = await getTranslations("actions.onboarding");
  const parsed = createRestaurantSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      error: t("invalidForm"),
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const context = await getDashboardContext();

  if (!context) {
    return { success: false, error: tActions("mustSignIn") };
  }

  const membership = await prisma.membership.findUnique({
    where: {
      userId_organizationId: {
        userId: context.user.id,
        organizationId: parsed.data.organizationId,
      },
    },
    include: {
      role: {
        include: {
          rolePermissions: {
            include: { permission: { select: { key: true } } },
          },
        },
      },
    },
  });

  if (!membership) {
    return { success: false, error: t("forbidden") };
  }

  const rolePermissions = membership.role.rolePermissions.map(
    (rolePermission) => rolePermission.permission.key,
  );
  const canCreate =
    membership.role.slug === SYSTEM_ROLE_SLUGS.OWNER ||
    rolePermissions.includes(PERMISSIONS.RESTAURANT_WRITE) ||
    rolePermissions.includes(PERMISSIONS.SETTINGS_WRITE);

  if (!canCreate) {
    return { success: false, error: t("forbidden") };
  }

  try {
    const restaurant = await prisma.restaurant.create({
      data: {
        organizationId: parsed.data.organizationId,
        name: parsed.data.name,
        city: parsed.data.city || null,
        currency: parsed.data.currency,
        timezone: parsed.data.timezone,
        businessType: parsed.data.businessType ?? null,
      },
      select: { id: true },
    });

    const cookieStore = await cookies();
    cookieStore.set(ACTIVE_RESTAURANT_COOKIE, restaurant.id, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });

    revalidatePath("/dashboard", "layout");
    revalidatePath("/dashboard/organizations");

    return { success: true, restaurantId: restaurant.id };
  } catch (error) {
    console.error("[organizations] failed to create restaurant", error);
    return { success: false, error: tActions("createFailed") };
  }
}
