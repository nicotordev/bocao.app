"use server";

import { cookies } from "next/headers";
import { ACTIVE_RESTAURANT_COOKIE } from "@/lib/dashboard/constants";
import {
  hasUserMembership,
  requireDashboardSession,
} from "@/lib/dashboard/context";
import {
  getPrimaryGoalRedirectPath,
  onboardingSchema,
  type OnboardingFormValues,
} from "@/lib/onboarding/schema";
import { createUniqueOrganizationSlug } from "@/lib/onboarding/slug";
import { prisma } from "@/lib/prisma";
import { seedOrganizationRoles } from "@/lib/rbac/seed-organization-roles";
import { SYSTEM_ROLE_SLUGS } from "@/lib/rbac/permissions";

export type CompleteOnboardingResult =
  | { success: true; redirectTo: string }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> };

function normalizeOptionalString(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : undefined;
}

export async function completeOnboarding(
  input: OnboardingFormValues,
): Promise<CompleteOnboardingResult> {
  const session = await requireDashboardSession();

  if (!session) {
    return { success: false, error: "Debes iniciar sesión para continuar" };
  }

  const alreadyOnboarded = await hasUserMembership(session.user.id);

  if (alreadyOnboarded) {
    return { success: false, error: "Tu cuenta ya completó el onboarding" };
  }

  const parsed = onboardingSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      error: "Revisa los datos del formulario",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const data = parsed.data;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const slug = await createUniqueOrganizationSlug(tx, data.organizationName);

      const organization = await tx.organization.create({
        data: {
          name: data.organizationName,
          slug,
          country: data.country,
        },
      });

      const rolesBySlug = await seedOrganizationRoles(tx, organization.id);
      const ownerRoleId = rolesBySlug[SYSTEM_ROLE_SLUGS.OWNER];

      if (!ownerRoleId) {
        throw new Error("Owner role was not seeded");
      }

      const restaurant = await tx.restaurant.create({
        data: {
          name: data.restaurantName,
          organizationId: organization.id,
          city: normalizeOptionalString(data.city),
          phone: normalizeOptionalString(data.phone),
          currency: data.currency,
          timezone: data.timezone,
          businessType: data.businessType ?? null,
          primaryGoal: data.primaryGoal,
          serviceModes: data.serviceModes,
        },
      });

      await tx.membership.create({
        data: {
          userId: session.user.id,
          organizationId: organization.id,
          roleId: ownerRoleId,
        },
      });

      return restaurant;
    });

    const cookieStore = await cookies();
    cookieStore.set(ACTIVE_RESTAURANT_COOKIE, result.id, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });

    return {
      success: true,
      redirectTo: getPrimaryGoalRedirectPath(data.primaryGoal),
    };
  } catch (error) {
    console.error("[onboarding] failed to complete setup", error);
    return {
      success: false,
      error: "No pudimos crear tu restaurante. Intenta nuevamente.",
    };
  }
}
