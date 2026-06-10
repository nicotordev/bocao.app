"use client";

import Link from "next/link";
import { TbChefHat } from "react-icons/tb";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from "@/components/ui/empty";
import type { KitchenLabels } from "./types";

type KitchenEmptyStateProps = {
  labels: KitchenLabels["empty"];
  onNewOrder?: () => void;
};

export function KitchenEmptyState({
  labels,
  onNewOrder,
}: KitchenEmptyStateProps) {
  return (
    <Empty className="border border-dashed border-border/70 bg-card/50">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <TbChefHat aria-hidden />
        </EmptyMedia>
        <EmptyTitle>{labels.title}</EmptyTitle>
        <EmptyDescription className="max-w-md">
          {labels.description}
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent className="flex flex-wrap justify-center gap-2">
        {onNewOrder ? (
          <Button onClick={onNewOrder}>{labels.ctaNewOrder}</Button>
        ) : (
          <Button asChild>
            <Link href="/dashboard/orders/new">{labels.ctaNewOrder}</Link>
          </Button>
        )}
        <Button variant="outline" asChild>
          <Link href="/dashboard/orders">{labels.ctaViewOrders}</Link>
        </Button>
      </EmptyContent>
    </Empty>
  );
}
