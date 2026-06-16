"use server";

import { revalidatePath } from "next/cache";
import { getDashboardContext } from "@/lib/dashboard/context";
import { toPrismaBusinessType } from "@/lib/settings/mappers";
import { updateRestaurantProfileSchema } from "@/lib/settings/schema";
import { prisma } from "@/lib/prisma";
import { PERMISSIONS } from "@/lib/rbac/permissions";
import { isValidContentLocaleCode } from "@/i18n/iso-languages";
import {
  buildRestaurantLocaleOptions,
  updateRestaurantContentLocales,
} from "@/lib/restaurant/content-locales";
import { uploadImageToR2 } from "@/lib/upload/image-upload";
import { z } from "zod";

export type UpdateRestaurantProfileResult =
  | { success: true }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> };

const updateContentLocalesSchema = z.object({
  restaurantId: z.string().cuid(),
  contentLocales: z
    .array(
      z
        .string()
        .trim()
        .refine((value) => isValidContentLocaleCode(value)),
    )
    .min(1),
  uiLocale: z.string().trim().optional(),
});

const weeklyScheduleItemSchema = z.object({
  dayKey: z.string(),
  open: z.string().regex(/^\d{2}:\d{2}$/),
  close: z.string().regex(/^\d{2}:\d{2}$/),
  closed: z.boolean(),
});

const updateRestaurantHoursSchema = z.object({
  restaurantId: z.string().cuid(),
  weeklySchedule: z.array(weeklyScheduleItemSchema).length(7),
});

const updateRestaurantAppearanceSchema = z.object({
  restaurantId: z.string().cuid(),
  brandColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
});

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

export async function updateSettingsContentLocalesAction(input: unknown) {
  const parsed = updateContentLocalesSchema.safeParse(input);

  if (!parsed.success) {
    return { success: false, error: "INVALID_INPUT" };
  }

  try {
    await requireSettingsWrite(parsed.data.restaurantId);

    const contentLocales = await updateRestaurantContentLocales(
      parsed.data.restaurantId,
      parsed.data.contentLocales,
    );
    const localeOptions = buildRestaurantLocaleOptions(
      contentLocales,
      parsed.data.uiLocale ?? "es",
    );

    revalidatePath("/dashboard/settings");
    revalidatePath("/dashboard/menu");

    return { success: true, contentLocales, localeOptions };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }

    return { success: false, error: "UNKNOWN_ERROR" };
  }
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

export async function updateRestaurantHoursAction(
  input: unknown,
): Promise<UpdateRestaurantProfileResult> {
  const parsed = updateRestaurantHoursSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      error: "INVALID_INPUT",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    await requireSettingsWrite(parsed.data.restaurantId);

    await prisma.$transaction(async (tx) => {
      await Promise.all(
        parsed.data.weeklySchedule.map((schedule, dayOfWeek) =>
          tx.restaurantOperatingHours.upsert({
            where: {
              restaurantId_dayOfWeek: {
                restaurantId: parsed.data.restaurantId,
                dayOfWeek,
              },
            },
            update: {
              openTime: schedule.open,
              closeTime: schedule.close,
              isClosed: schedule.closed,
            },
            create: {
              restaurantId: parsed.data.restaurantId,
              dayOfWeek,
              openTime: schedule.open,
              closeTime: schedule.close,
              isClosed: schedule.closed,
            },
          }),
        ),
      );
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

export async function updateRestaurantAppearanceAction(
  input: unknown,
): Promise<UpdateRestaurantProfileResult> {
  const parsed = updateRestaurantAppearanceSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      error: "INVALID_INPUT",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    await requireSettingsWrite(parsed.data.restaurantId);

    await prisma.restaurant.update({
      where: { id: parsed.data.restaurantId },
      data: {
        brandColor: parsed.data.brandColor,
      },
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

export async function uploadRestaurantLogoAction(formData: FormData) {
  const restaurantId = formData.get("restaurantId");

  if (typeof restaurantId !== "string" || restaurantId.length === 0) {
    throw new Error("INVALID_RESTAURANT");
  }

  await requireSettingsWrite(restaurantId);

  const file = formData.get("file");

  if (!(file instanceof File)) {
    throw new Error("NO_FILE");
  }

  try {
    const url = await uploadImageToR2(file, `restaurants/${restaurantId}/logo`);

    await prisma.restaurant.update({
      where: { id: restaurantId },
      data: { logoUrl: url },
    });

    revalidatePath("/dashboard/settings");

    return { url };
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "INVALID_IMAGE_TYPE") {
        throw new Error("INVALID_IMAGE_TYPE");
      }

      if (error.message === "IMAGE_TOO_LARGE") {
        throw new Error("IMAGE_TOO_LARGE");
      }

      if (error.message === "R2_NOT_CONFIGURED") {
        throw new Error("R2_NOT_CONFIGURED");
      }
    }

    throw new Error("UPLOAD_FAILED");
  }
}
