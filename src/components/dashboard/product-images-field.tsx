"use client";

import { ChevronLeft, ChevronRight, ImagePlus, Loader2, X } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ProductImagesFieldLabels = {
  addPhoto: string;
  removePhoto: string;
  uploading: string;
  uploadError: string;
  invalidImageType: string;
  imageTooLarge: string;
  storageNotConfigured: string;
  moveEarlier?: string;
  moveLater?: string;
  photoSortOrder?: string;
};

type ProductImagesFieldProps = {
  labels: ProductImagesFieldLabels;
  imageUrls: string[];
  onChange: (imageUrls: string[]) => void;
  disabled?: boolean;
  maxImages?: number;
  variant?: "default" | "gallery";
  onUpload: (file: File) => Promise<string>;
};

export function ProductImagesField({
  labels,
  imageUrls,
  onChange,
  disabled = false,
  maxImages = 8,
  variant = "default",
  onUpload,
}: ProductImagesFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const files = event.target.files;

    if (!files?.length) {
      return;
    }

    const remainingSlots = maxImages - imageUrls.length;

    if (remainingSlots <= 0) {
      event.target.value = "";
      return;
    }

    setIsUploading(true);

    try {
      const uploadedUrls: string[] = [];

      for (const file of Array.from(files).slice(0, remainingSlots)) {
        try {
          uploadedUrls.push(await onUpload(file));
        } catch (error) {
          const message =
            error instanceof Error ? error.message : labels.uploadError;

          if (message === "INVALID_IMAGE_TYPE") {
            toast.error(labels.invalidImageType);
          } else if (message === "IMAGE_TOO_LARGE") {
            toast.error(labels.imageTooLarge);
          } else if (message === "R2_NOT_CONFIGURED") {
            toast.error(labels.storageNotConfigured);
          } else {
            toast.error(labels.uploadError);
          }
        }
      }

      if (uploadedUrls.length > 0) {
        onChange([...imageUrls, ...uploadedUrls]);
      }
    } finally {
      setIsUploading(false);
      event.target.value = "";
    }
  }

  function removeImage(url: string) {
    onChange(imageUrls.filter((imageUrl) => imageUrl !== url));
  }

  function moveImage(index: number, direction: -1 | 1) {
    const targetIndex = index + direction;

    if (targetIndex < 0 || targetIndex >= imageUrls.length) {
      return;
    }

    const next = [...imageUrls];
    const [moved] = next.splice(index, 1);
    next.splice(targetIndex, 0, moved);
    onChange(next);
  }

  const canAddMore = imageUrls.length < maxImages;
  const isGallery = variant === "gallery";

  return (
    <div className="space-y-3">
      <div
        className={cn(
          isGallery
            ? "grid grid-cols-2 gap-3 sm:grid-cols-3"
            : "flex flex-wrap gap-2",
        )}
      >
        {imageUrls.map((url, index) => (
          <div
            key={url}
            className={cn(
              "relative overflow-hidden rounded-2xl border border-border bg-muted/30",
              isGallery ? "aspect-square" : "size-16",
            )}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt="" className="size-full object-cover" />

            {isGallery ? (
              <span className="absolute bottom-2 left-2 flex size-7 items-center justify-center rounded-full bg-background/90 text-xs font-semibold shadow-sm">
                {index + 1}
              </span>
            ) : null}

            {!disabled ? (
              <Button
                type="button"
                variant="secondary"
                size="icon-xs"
                className="absolute top-1 right-1 size-6 rounded-full"
                onClick={() => removeImage(url)}
                aria-label={labels.removePhoto}
              >
                <X className="size-3.5" aria-hidden />
              </Button>
            ) : null}

            {!disabled && isGallery && imageUrls.length > 1 ? (
              <div className="absolute inset-x-2 top-1/2 flex -translate-y-1/2 justify-between">
                <Button
                  type="button"
                  variant="secondary"
                  size="icon-xs"
                  className="size-7 rounded-full bg-background/90 shadow-sm"
                  onClick={() => moveImage(index, -1)}
                  disabled={index === 0}
                  aria-label={
                    labels.moveEarlier ??
                    labels.photoSortOrder?.replace("{order}", String(index)) ??
                    `Move photo ${index + 1} earlier`
                  }
                >
                  <ChevronLeft className="size-4" aria-hidden />
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="icon-xs"
                  className="size-7 rounded-full bg-background/90 shadow-sm"
                  onClick={() => moveImage(index, 1)}
                  disabled={index === imageUrls.length - 1}
                  aria-label={
                    labels.moveLater ??
                    labels.photoSortOrder?.replace("{order}", String(index + 2)) ??
                    `Move photo ${index + 1} later`
                  }
                >
                  <ChevronRight className="size-4" aria-hidden />
                </Button>
              </div>
            ) : null}
          </div>
        ))}

        {!disabled && canAddMore ? (
          <button
            type="button"
            className={cn(
              "flex flex-col items-center justify-center gap-1 rounded-2xl border border-dashed border-border bg-muted/20 text-xs text-muted-foreground transition-colors hover:bg-muted/40",
              isGallery ? "aspect-square min-h-28" : "size-16",
              isUploading && "pointer-events-none opacity-60",
            )}
            onClick={() => inputRef.current?.click()}
            disabled={isUploading}
          >
            {isUploading ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : (
              <ImagePlus className="size-4" aria-hidden />
            )}
            <span>{isUploading ? labels.uploading : labels.addPhoto}</span>
          </button>
        ) : null}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}

export type { ProductImagesFieldLabels };
