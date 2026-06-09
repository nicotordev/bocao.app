"use server";

import { requireRestaurantCustomersWriteAccess } from "@/lib/customers/api-auth";
import { uploadImageToR2 } from "@/lib/upload/image-upload";

export async function uploadCustomerAvatarAction(formData: FormData) {
  const restaurantId = formData.get("restaurantId");

  if (typeof restaurantId !== "string" || restaurantId.length === 0) {
    throw new Error("INVALID_RESTAURANT");
  }

  const access = await requireRestaurantCustomersWriteAccess(restaurantId);

  if (!access.ok) {
    throw new Error("FORBIDDEN");
  }

  const file = formData.get("file");

  if (!(file instanceof File)) {
    throw new Error("NO_FILE");
  }

  try {
    const url = await uploadImageToR2(file, `customers/${restaurantId}`);

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
