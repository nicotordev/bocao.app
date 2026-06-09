"use client";

import { uploadKitchenStationImageAction } from "@/app/actions/kitchen";
import { MenuTagIconPicker } from "@/components/dashboard/menu/menu-tag-icon-picker";
import {
  ProductImagesField,
  type ProductImagesFieldLabels,
} from "@/components/dashboard/product-images-field";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import type { MenuTagIconId } from "@/lib/menu/tag-icons";

export type KitchenStationVisualFieldLabels = {
  image: string;
  imageHint: string;
  icon: string;
  iconHint: string;
  orDivider: string;
  photos: ProductImagesFieldLabels;
};

type KitchenStationVisualFieldProps = {
  labels: KitchenStationVisualFieldLabels;
  restaurantId: string;
  imageUrl: string | null;
  iconId: MenuTagIconId | null;
  onImageChange: (imageUrl: string | null) => void;
  onIconChange: (iconId: MenuTagIconId | null) => void;
  disabled?: boolean;
};

export function KitchenStationVisualField({
  labels,
  restaurantId,
  imageUrl,
  iconId,
  onImageChange,
  onIconChange,
  disabled = false,
}: KitchenStationVisualFieldProps) {
  async function handleUpload(file: File) {
    const formData = new FormData();
    formData.append("restaurantId", restaurantId);
    formData.append("file", file);

    const result = await uploadKitchenStationImageAction(formData);
    return result.url;
  }

  function handleImageChange(urls: string[]) {
    const nextUrl = urls[0] ?? null;
    onImageChange(nextUrl);

    if (nextUrl) {
      onIconChange(null);
    }
  }

  function handleIconChange(nextIcon: MenuTagIconId) {
    onIconChange(nextIcon);
    onImageChange(null);
  }

  return (
    <Field>
      <FieldLabel>{labels.image}</FieldLabel>
      <FieldDescription>{labels.imageHint}</FieldDescription>

      <div className="mt-2 space-y-4">
        <ProductImagesField
          labels={labels.photos}
          imageUrls={imageUrl ? [imageUrl] : []}
          onChange={handleImageChange}
          onUpload={handleUpload}
          disabled={disabled}
          maxImages={1}
        />

        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs font-medium text-muted-foreground">
            {labels.orDivider}
          </span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">{labels.icon}</p>
          <FieldDescription>{labels.iconHint}</FieldDescription>
          <MenuTagIconPicker
            value={iconId ?? undefined}
            onChange={handleIconChange}
            disabled={disabled || Boolean(imageUrl)}
          />
        </div>
      </div>
    </Field>
  );
}
