"use client";

import { useMemo, useState } from "react";
import { TbCheck } from "react-icons/tb";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatCurrency } from "@/lib/orders/currency";
import type { MenuItemOption } from "@/lib/menu/types";
import { cn } from "@/lib/utils";
import type { MarketingAiLabels } from "./types";

type MarketingMenuProductPickerDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  labels: MarketingAiLabels["productPicker"];
  currency: string;
  menuItems: MenuItemOption[];
  selectedMenuItemId?: string;
  onSelectMenuItem: (menuItem: MenuItemOption) => void;
};

export function MarketingMenuProductPickerDialog({
  open,
  onOpenChange,
  labels,
  currency,
  menuItems,
  selectedMenuItemId,
  onSelectMenuItem,
}: MarketingMenuProductPickerDialogProps) {
  const groupedMenuItems = useMemo(
    () => groupMenuItemsByCategory(menuItems),
    [menuItems],
  );
  const categories = useMemo(
    () => [...groupedMenuItems.keys()],
    [groupedMenuItems],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(90vh,820px)] flex-col gap-0 overflow-hidden p-0 sm:max-w-4xl">
        <DialogHeader className="border-b border-border px-6 py-5">
          <DialogTitle>{labels.title}</DialogTitle>
          <DialogDescription>{labels.description}</DialogDescription>
        </DialogHeader>

        {open && menuItems.length > 0 ? (
          <MarketingMenuProductPickerContent
            key={categories.join(",")}
            labels={labels}
            currency={currency}
            categories={categories}
            groupedMenuItems={groupedMenuItems}
            selectedMenuItemId={selectedMenuItemId}
            onSelectMenuItem={(item) => {
              onSelectMenuItem(item);
              onOpenChange(false);
            }}
          />
        ) : menuItems.length > 0 ? null : (
          <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 text-center">
            <p className="font-medium">{labels.emptyTitle}</p>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">
              {labels.emptyDescription}
            </p>
          </div>
        )}

        <DialogFooter className="border-t border-border px-6 py-4">
          <p className="text-sm text-muted-foreground">{labels.footerHint}</p>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function MarketingMenuProductPickerContent({
  labels,
  currency,
  categories,
  groupedMenuItems,
  selectedMenuItemId,
  onSelectMenuItem,
}: {
  labels: MarketingAiLabels["productPicker"];
  currency: string;
  categories: string[];
  groupedMenuItems: Map<string, MenuItemOption[]>;
  selectedMenuItemId?: string;
  onSelectMenuItem: (menuItem: MenuItemOption) => void;
}) {
  const [activeCategory, setActiveCategory] = useState(
    () => categories[0] ?? "",
  );

  const activeItems =
    groupedMenuItems.get(activeCategory) ??
    groupedMenuItems.get(categories[0] ?? "") ??
    [];

  return (
    <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,11rem)_minmax(0,1fr)]">
      <aside className="border-r border-border bg-muted/20 p-3">
        <ScrollArea className="h-[min(58vh,520px)]">
          <div className="flex flex-col gap-2 pr-2">
            {categories.map((categoryName) => (
              <button
                key={categoryName}
                type="button"
                onClick={() => setActiveCategory(categoryName)}
                className={cn(
                  "rounded-2xl px-3 py-3 text-left text-sm font-medium transition-colors",
                  activeCategory === categoryName
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-card text-foreground hover:bg-accent hover:text-accent-foreground",
                )}
              >
                {categoryName}
              </button>
            ))}
          </div>
        </ScrollArea>
      </aside>

      <ScrollArea className="h-[min(58vh,520px)]">
        <div className="flex flex-col gap-3 p-4">
          {activeItems.map((menuItem) => (
            <button
              key={menuItem.id}
              type="button"
              onClick={() => onSelectMenuItem(menuItem)}
              aria-label={`${labels.selectProduct}: ${menuItem.name}`}
              className={cn(
                "group flex w-full items-stretch gap-4 rounded-3xl border bg-card p-3 text-left transition-colors",
                selectedMenuItemId === menuItem.id
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/30 hover:bg-accent/40",
              )}
            >
              <ProductHeroImage
                name={menuItem.name}
                imageUrl={menuItem.images[0]}
              />
              <span className="flex min-w-0 flex-1 flex-col justify-center gap-1">
                <span className="font-heading text-base font-semibold leading-tight">
                  {menuItem.name}
                </span>
                {menuItem.description ? (
                  <span className="line-clamp-2 text-sm text-muted-foreground">
                    {menuItem.description}
                  </span>
                ) : null}
                <span className="pt-1 text-sm font-medium">
                  {formatCurrency(menuItem.priceCents, currency)}
                </span>
              </span>
              <span className="flex items-center pr-1">
                <span
                  className={cn(
                    "flex size-10 items-center justify-center rounded-full transition-transform group-hover:scale-105",
                    selectedMenuItemId === menuItem.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  <TbCheck className="size-5" aria-hidden />
                </span>
              </span>
            </button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

function ProductHeroImage({
  name,
  imageUrl,
}: {
  name: string;
  imageUrl?: string;
}) {
  if (!imageUrl) {
    return (
      <div className="flex size-24 shrink-0 items-center justify-center rounded-2xl border border-dashed border-border bg-muted/40 text-2xl font-semibold text-muted-foreground">
        {name.slice(0, 1).toUpperCase()}
      </div>
    );
  }

  return (
    <div className="size-24 shrink-0 overflow-hidden rounded-2xl border border-border bg-muted/20">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={imageUrl} alt={name} className="size-full object-cover" />
    </div>
  );
}

function groupMenuItemsByCategory(
  menuItems: MenuItemOption[],
): Map<string, MenuItemOption[]> {
  const grouped = new Map<string, MenuItemOption[]>();

  for (const item of menuItems) {
    const current = grouped.get(item.categoryName) ?? [];
    current.push(item);
    grouped.set(item.categoryName, current);
  }

  return grouped;
}
