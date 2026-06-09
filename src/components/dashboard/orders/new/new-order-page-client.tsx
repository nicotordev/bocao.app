"use client";

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { NewOrderForm } from "./new-order-form";
import { NewOrderHeader } from "./new-order-header";
import type { NewOrderPageClientProps } from "./types";

export function NewOrderPageClient({
  labels,
  restaurantId,
  currency,
  canCreate,
  menuItems,
  customers,
  floorPlanSurface,
  occupiedTableNumbers,
  initialTableNumber,
  localeOptions,
}: NewOrderPageClientProps) {
  return (
    <main className="flex flex-col gap-6 p-4 md:p-6">
      <NewOrderHeader labels={labels} />

      {canCreate ? (
        <NewOrderForm
          labels={labels}
          restaurantId={restaurantId}
          currency={currency}
          menuItems={menuItems}
          customers={customers}
          floorPlanSurface={floorPlanSurface}
          occupiedTableNumbers={occupiedTableNumbers}
          initialTableNumber={initialTableNumber}
          localeOptions={localeOptions}
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>{labels.permissions.deniedTitle}</CardTitle>
            <CardDescription>{labels.permissions.deniedDescription}</CardDescription>
          </CardHeader>
        </Card>
      )}
    </main>
  );
}
