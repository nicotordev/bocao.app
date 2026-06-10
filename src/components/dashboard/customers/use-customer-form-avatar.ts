"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import { uploadCustomerAvatarAction } from "@/app/actions/customers";
import type { CustomerAvatarFieldLabels } from "@/lib/customers/customer-form-labels";
import type { CustomerFormAvatarState } from "./customer-form";

export function useCustomerFormAvatar() {
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState("");

  const clearAvatarPreview = useCallback(() => {
    if (avatarPreview.startsWith("blob:")) {
      URL.revokeObjectURL(avatarPreview);
    }
  }, [avatarPreview]);

  const resetAvatar = useCallback(() => {
    clearAvatarPreview();
    setAvatarFile(null);
    setAvatarPreview("");
  }, [clearAvatarPreview]);

  const avatarState: CustomerFormAvatarState = {
    avatarFile,
    avatarPreview,
    setAvatarFile,
    setAvatarPreview,
    clearAvatarPreview,
  };

  async function resolveAvatarUrl(
    restaurantId: string,
    fallbackAvatar: string,
    avatarLabels?: CustomerAvatarFieldLabels,
  ) {
    const trimmedAvatar = fallbackAvatar.trim();

    if (avatarFile) {
      const formData = new FormData();
      formData.append("restaurantId", restaurantId);
      formData.append("file", avatarFile);

      try {
        const result = await uploadCustomerAvatarAction(formData);
        return result.url;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "UPLOAD_FAILED";

        if (message === "INVALID_IMAGE_TYPE") {
          toast.error(avatarLabels?.invalidImageType);
        } else if (message === "IMAGE_TOO_LARGE") {
          toast.error(avatarLabels?.imageTooLarge);
        } else {
          toast.error(avatarLabels?.uploadError);
        }

        throw error;
      }
    }

    return trimmedAvatar;
  }

  return {
    avatarState,
    resetAvatar,
    resolveAvatarUrl,
  };
}
