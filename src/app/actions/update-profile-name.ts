"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { requireDashboardSession } from "@/lib/dashboard/context";
import { formatProfileName } from "@/lib/user-profile";

type UpdateProfileNameInput = {
  firstName: string;
  lastName: string;
};

export async function updateProfileNameAction(input: UpdateProfileNameInput) {
  const t = await getTranslations("dashboard.completeProfileName.toasts");
  const session = await requireDashboardSession();

  if (!session) {
    return { success: false as const, error: t("error") };
  }

  const firstName = input.firstName.trim();
  const lastName = input.lastName.trim();

  if (!firstName) {
    return { success: false as const, error: t("firstNameRequired") };
  }

  if (!lastName) {
    return { success: false as const, error: t("lastNameRequired") };
  }

  if (firstName.length < 2 || lastName.length < 2) {
    return { success: false as const, error: t("minLength") };
  }

  const name = formatProfileName(firstName, lastName);

  try {
    await auth.api.updateUser({
      body: { name },
      headers: await headers(),
    });
  } catch (error) {
    console.error("[updateProfileNameAction]", error);
    return { success: false as const, error: t("error") };
  }

  revalidatePath("/dashboard", "layout");
  revalidatePath("/onboarding", "layout");

  return { success: true as const, name };
}
