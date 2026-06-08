"use server";

import { getDashboardContext } from "@/lib/dashboard/context";
import { updateMenuItemImages } from "@/lib/menu/repository";
import { updateMenuItemImagesSchema } from "@/lib/menu/schemas";
import { PERMISSIONS } from "@/lib/rbac/permissions";
import { uploadImageToR2 } from "@/lib/upload/image-upload";

function requireMenuWrite(restaurantId: string) {
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
      PERMISSIONS.MENU_WRITE,
    );

    if (!canWrite) {
      throw new Error("FORBIDDEN");
    }

    return context;
  });
}

export async function uploadMenuItemImageAction(formData: FormData) {
  const restaurantId = formData.get("restaurantId");

  if (typeof restaurantId !== "string" || restaurantId.length === 0) {
    throw new Error("INVALID_RESTAURANT");
  }

  await requireMenuWrite(restaurantId);

  const file = formData.get("file");

  if (!(file instanceof File)) {
    throw new Error("NO_FILE");
  }

  try {
    const url = await uploadImageToR2(
      file,
      `menu-items/${restaurantId}`,
    );

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

export async function updateMenuItemImagesAction(input: {
  restaurantId: string;
  menuItemId: string;
  images: string[];
}) {
  const parsed = updateMenuItemImagesSchema.safeParse(input);

  if (!parsed.success) {
    throw new Error("INVALID_INPUT");
  }

  await requireMenuWrite(parsed.data.restaurantId);

  const item = await updateMenuItemImages(
    parsed.data.restaurantId,
    parsed.data.menuItemId,
    parsed.data.images,
  );

  return { item };
}

export async function uploadOrderItemImageAction(formData: FormData) {
  const sessionContext = await getDashboardContext();

  if (!sessionContext) {
    throw new Error("UNAUTHORIZED");
  }

  const restaurantId = formData.get("restaurantId");

  if (typeof restaurantId !== "string" || restaurantId.length === 0) {
    throw new Error("INVALID_RESTAURANT");
  }

  const allowed = sessionContext.restaurants.some(
    (restaurant) => restaurant.id === restaurantId,
  );

  if (!allowed) {
    throw new Error("FORBIDDEN");
  }

  const canWrite = sessionContext.membership.permissions.includes(
    PERMISSIONS.ORDERS_WRITE,
  );

  if (!canWrite) {
    throw new Error("FORBIDDEN");
  }

  const file = formData.get("file");

  if (!(file instanceof File)) {
    throw new Error("NO_FILE");
  }

  try {
    const url = await uploadImageToR2(
      file,
      `order-items/${restaurantId}`,
    );

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
