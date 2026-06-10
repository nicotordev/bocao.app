"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { NewOrderForm } from "@/components/dashboard/orders/new/new-order-form";
import type { NewOrderPageClientProps } from "@/components/dashboard/orders/new/types";

type KitchenNewOrderDialogProps = Pick<
  NewOrderPageClientProps,
  | "labels"
  | "restaurantId"
  | "currency"
  | "canCreate"
  | "menuItems"
  | "customers"
  | "floorPlanSurface"
  | "occupiedTableNumbers"
  | "localeOptions"
> & {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (orderId: string) => void;
};

export function KitchenNewOrderDialog({
  open,
  onOpenChange,
  onCreated,
  labels,
  restaurantId,
  currency,
  canCreate,
  menuItems,
  customers,
  floorPlanSurface,
  occupiedTableNumbers,
  localeOptions,
}: KitchenNewOrderDialogProps) {
  const [formKey, setFormKey] = useState(0);

  useEffect(() => {
    if (open) {
      setFormKey((current) => current + 1);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="grid max-h-[min(92vh,960px)] grid-rows-[auto_minmax(0,1fr)] gap-0 overflow-hidden p-0 sm:max-w-6xl">
        <DialogHeader className="shrink-0 border-b border-border px-6 py-5 text-left">
          <DialogTitle className="font-heading text-xl font-semibold">
            {labels.header.title}
          </DialogTitle>
          <DialogDescription>{labels.header.subtitle}</DialogDescription>
        </DialogHeader>

        <div className="min-h-0 overflow-y-auto px-6 py-6">
          {canCreate ? (
            <NewOrderForm
              key={formKey}
              labels={labels}
              restaurantId={restaurantId}
              currency={currency}
              menuItems={menuItems}
              customers={customers}
              floorPlanSurface={floorPlanSurface}
              occupiedTableNumbers={occupiedTableNumbers}
              localeOptions={localeOptions}
              formClassName="xl:grid-cols-[minmax(0,1fr)_280px]"
              onSuccess={(orderId) => {
                onCreated?.(orderId);
                onOpenChange(false);
              }}
            />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>{labels.permissions.deniedTitle}</CardTitle>
                <CardDescription>
                  {labels.permissions.deniedDescription}
                </CardDescription>
              </CardHeader>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
