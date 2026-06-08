"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  updateMenuItemImagesAction,
  uploadMenuItemImageAction,
} from "@/app/actions/menu";
import {
  ProductImagesField,
  type ProductImagesFieldLabels,
} from "@/components/dashboard/product-images-field";
import { formatCurrency } from "@/lib/orders/currency";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { MenuItemRecord } from "@/lib/menu/types";
import type { MenuPageClientProps } from "./types";

export function MenuPageClient({
  labels,
  restaurantId,
  currency,
  canEdit,
  items: initialItems,
}: MenuPageClientProps) {
  const [items, setItems] = useState(initialItems);
  const photoLabels: ProductImagesFieldLabels = labels.photos;

  const groupedItems = groupItemsByCategory(items);

  async function handleUpload(file: File) {
    const formData = new FormData();
    formData.append("restaurantId", restaurantId);
    formData.append("file", file);

    try {
      const result = await uploadMenuItemImageAction(formData);
      return result.url;
    } catch (error) {
      throw error instanceof Error ? error : new Error(labels.photos.uploadError);
    }
  }

  async function handleImagesChange(menuItemId: string, images: string[]) {
    const previousItems = items;

    setItems((current) =>
      current.map((item) =>
        item.id === menuItemId ? { ...item, images } : item,
      ),
    );

    try {
      const result = await updateMenuItemImagesAction({
        restaurantId,
        menuItemId,
        images,
      });

      setItems((current) =>
        current.map((item) =>
          item.id === menuItemId ? result.item : item,
        ),
      );
      toast.success(labels.photos.saveSuccess);
    } catch {
      setItems(previousItems);
      toast.error(labels.photos.saveError);
    }
  }

  return (
    <main className="flex flex-col gap-6 p-4 md:p-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          {labels.header.title}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {labels.header.subtitle}
        </p>
      </div>

      {items.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>{labels.empty.title}</CardTitle>
            <CardDescription>{labels.empty.description}</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="space-y-6">
          {[...groupedItems.entries()].map(([categoryName, categoryItems]) => (
            <section key={categoryName} className="space-y-3">
              <h2 className="font-heading text-lg font-medium">{categoryName}</h2>
              <div className="grid gap-4 lg:grid-cols-2">
                {categoryItems.map((item) => (
                  <MenuItemCard
                    key={item.id}
                    item={item}
                    currency={currency}
                    labels={labels}
                    photoLabels={photoLabels}
                    canEdit={canEdit}
                    onUpload={handleUpload}
                    onImagesChange={handleImagesChange}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </main>
  );
}

function MenuItemCard({
  item,
  currency,
  labels,
  photoLabels,
  canEdit,
  onUpload,
  onImagesChange,
}: {
  item: MenuItemRecord;
  currency: string;
  labels: MenuPageClientProps["labels"];
  photoLabels: ProductImagesFieldLabels;
  canEdit: boolean;
  onUpload: (file: File) => Promise<string>;
  onImagesChange: (menuItemId: string, images: string[]) => void;
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base">{item.name}</CardTitle>
            {item.description ? (
              <CardDescription className="mt-1">{item.description}</CardDescription>
            ) : null}
          </div>
          <p className="text-sm font-medium">
            {formatCurrency(item.priceCents, currency)}
          </p>
        </div>
        {!item.isAvailable ? (
          <p className="text-xs text-muted-foreground">{labels.item.unavailable}</p>
        ) : null}
      </CardHeader>
      <CardContent>
        <p className="mb-2 text-sm font-medium">{labels.item.photos}</p>
        <ProductImagesField
          labels={photoLabels}
          imageUrls={item.images}
          onChange={(images) => onImagesChange(item.id, images)}
          disabled={!canEdit}
          onUpload={onUpload}
        />
      </CardContent>
    </Card>
  );
}

function groupItemsByCategory(items: MenuItemRecord[]) {
  const grouped = new Map<string, MenuItemRecord[]>();

  for (const item of items) {
    const current = grouped.get(item.categoryName) ?? [];
    current.push(item);
    grouped.set(item.categoryName, current);
  }

  return grouped;
}
