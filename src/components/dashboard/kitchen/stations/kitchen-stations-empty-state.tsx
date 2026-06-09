"use client";

import { Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
    <Card className="border-dashed border-border/70 bg-card/50">
      <CardHeader className="items-center text-center">
        <div className="grid size-14 place-items-center rounded-3xl border border-border bg-muted/40">
          <Flame className="size-7 text-muted-foreground" aria-hidden />
        </div>
        <CardTitle className="text-xl">{labels.title}</CardTitle>
        <CardDescription className="max-w-md">
          {labels.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex justify-center pb-8">
        <Button onClick={onCreate}>{labels.cta}</Button>
      </CardContent>
    </Card>
  );
}
