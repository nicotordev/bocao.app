"use server";

import { getDashboardContext } from "@/lib/dashboard/context";
import { PERMISSIONS } from "@/lib/rbac/permissions";
import { uploadImageToR2 } from "@/lib/upload/image-upload";

function requireRestaurantWrite(restaurantId: string) {
  return getDashboardContext().then((context) => {
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
      PERMISSIONS.RESTAURANT_WRITE,
    );

    if (!canWrite) {
      throw new Error("FORBIDDEN");
    }

    return context;
  });
}

export async function uploadKitchenStationImageAction(formData: FormData) {
  const restaurantId = formData.get("restaurantId");

  if (typeof restaurantId !== "string" || restaurantId.length === 0) {
    throw new Error("INVALID_RESTAURANT");
  }

  await requireRestaurantWrite(restaurantId);

  const file = formData.get("file");

  if (!(file instanceof File)) {
    throw new Error("NO_FILE");
  }

  try {
    const url = await uploadImageToR2(file, `kitchen-stations/${restaurantId}`);

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
