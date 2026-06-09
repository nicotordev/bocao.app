"use client";

import { Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from "@/components/ui/empty";
import type { KitchenStationsLabels } from "./types";

type KitchenStationsEmptyStateProps = {
  labels: KitchenStationsLabels["empty"];
  onCreate: () => void;
};

export function KitchenStationsEmptyState({
  labels,
  onCreate,
}: KitchenStationsEmptyStateProps) {
  return (
    <Empty className="border border-dashed border-border/70 bg-card/50">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Flame className="size-7 text-muted-foreground" aria-hidden />
        </EmptyMedia>
        <EmptyTitle>{labels.title}</EmptyTitle>
        <EmptyDescription>{labels.description}</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button onClick={onCreate}>{labels.cta}</Button>
      </EmptyContent>
    </Empty>
  );
}
