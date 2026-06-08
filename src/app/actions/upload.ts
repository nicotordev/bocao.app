"use server";

import { requireDashboardSession } from "@/lib/dashboard/context";
import { uploadImageToR2 } from "@/lib/upload/image-upload";

export async function uploadAvatarAction(formData: FormData) {
  const session = await requireDashboardSession();
  if (!session) {
    throw new Error("No autorizado");
  }

  const file = formData.get("file") as File;
  if (!file) {
    throw new Error("No se ha seleccionado ningún archivo");
  }

  try {
    const publicUrl = await uploadImageToR2(file, `avatars/${session.user.id}`);
    return { url: publicUrl };
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "INVALID_IMAGE_TYPE") {
        throw new Error("El archivo debe ser una imagen válida");
      }

      if (error.message === "IMAGE_TOO_LARGE") {
        throw new Error("La imagen excede el tamaño máximo permitido de 5MB");
      }

      if (error.message === "R2_NOT_CONFIGURED") {
        throw new Error("Cloudflare R2 no está configurado en las variables de entorno");
      }
    }

    console.error("[uploadAvatarAction] Error:", error);
    throw new Error("Error al subir el archivo a Cloudflare R2");
  }
}
