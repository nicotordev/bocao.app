"use client";

import { Minus, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import type { MenuItemOption } from "@/lib/menu/types";
import { formatCurrency } from "@/lib/orders/currency";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CustomProductDialog } from "./custom-product-dialog";
import { MenuProductPickerDialog } from "./menu-product-picker-dialog";
import type { NewOrderLabels, NewOrderLineItem } from "./types";

type NewOrderItemsSectionProps = {
  labels: NewOrderLabels;
  currency: string;
  restaurantId: string;
  menuItems: MenuItemOption[];
  items: NewOrderLineItem[];
  error?: string;
  onAddFromMenu: (menuItem: MenuItemOption) => void;
  onAddCustom: (
    name: string,
    priceCents: number,
    quantity: number,
    imageUrls: string[],
  ) => void;
  onRemove: (id: string) => void;
  onUpdateQuantity: (id: string, quantity: number) => void;
};

export function NewOrderItemsSection({
  labels,
  currency,
  menuItems,
  items,
  error,
  onAddFromMenu,
  onAddCustom,
  onRemove,
  onUpdateQuantity,
}: NewOrderItemsSectionProps) {
  const [menuDialogOpen, setMenuDialogOpen] = useState(false);
  const [customDialogOpen, setCustomDialogOpen] = useState(false);

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <CardTitle>{labels.items.title}</CardTitle>
          <CardDescription>{labels.items.description}</CardDescription>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" className="gap-2" onClick={() => setMenuDialogOpen(true)}>
            <Plus className="size-4" aria-hidden />
            {labels.actions.addItem}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => setCustomDialogOpen(true)}
          >
            {labels.items.picker.customProduct}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        {items.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-muted/30 p-6 text-center">
            <p className="font-medium">{labels.items.empty}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {labels.items.emptyDescription}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-border rounded-3xl border border-border bg-card">
            {items.map((item) => (
              <OrderListItem
                key={item.id}
                labels={labels}
                currency={currency}
                item={item}
                onRemove={() => onRemove(item.id)}
                onUpdateQuantity={(quantity) => onUpdateQuantity(item.id, quantity)}
              />
            ))}
          </ul>
        )}
      </CardContent>

      <MenuProductPickerDialog
        open={menuDialogOpen}
        onOpenChange={setMenuDialogOpen}
        labels={labels}
        currency={currency}
        menuItems={menuItems}
        onSelectMenuItem={onAddFromMenu}
      />

      <CustomProductDialog
        open={customDialogOpen}
        onOpenChange={setCustomDialogOpen}
        labels={labels}
        currency={currency}
        onAddCustom={onAddCustom}
      />
    </Card>
  );
}

function OrderListItem({
  labels,
  currency,
  item,
  onRemove,
  onUpdateQuantity,
}: {
  labels: NewOrderLabels;
  currency: string;
  item: NewOrderLineItem;
  onRemove: () => void;
  onUpdateQuantity: (quantity: number) => void;
}) {
  const lineTotalCents = item.quantity * item.priceCents;

  return (
    <li className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-4">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <ProductThumbnail
          name={item.name}
          imageUrl={item.imageUrls[0]}
        />
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{item.name}</p>
          <p className="text-sm text-muted-foreground">
            {formatCurrency(item.priceCents, currency)} · {labels.items.quantity}{" "}
            {item.quantity}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 sm:justify-end">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            onClick={() => onUpdateQuantity(Math.max(1, item.quantity - 1))}
            aria-label={labels.actions.removeItem}
          >
            <Minus className="size-4" aria-hidden />
          </Button>
          <span className="min-w-8 text-center text-sm font-medium">{item.quantity}</span>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            onClick={() => onUpdateQuantity(Math.min(99, item.quantity + 1))}
            aria-label={labels.actions.addItem}
          >
            <Plus className="size-4" aria-hidden />
          </Button>
        </div>

        <p className="min-w-24 text-right text-sm font-medium">
          {formatCurrency(lineTotalCents, currency)}
        </p>

        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={onRemove}
          aria-label={labels.actions.removeItem}
        >
          <Trash2 className="size-4" aria-hidden />
        </Button>
      </div>
    </li>
  );
}

function ProductThumbnail({
  name,
  imageUrl,
}: {
  name: string;
  imageUrl?: string;
}) {
  if (!imageUrl) {
    return (
      <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-dashed border-border bg-muted/30 text-sm font-medium text-muted-foreground">
        {name.slice(0, 1).toUpperCase()}
      </div>
    );
  }

  return (
    <div className="size-12 shrink-0 overflow-hidden rounded-2xl border border-border">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={imageUrl} alt={name} className="size-full object-cover" />
    </div>
  );
}
