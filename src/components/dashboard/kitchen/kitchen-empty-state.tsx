"use client";

import Link from "next/link";
import { ChefHat } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { KitchenLabels } from "./types";

type KitchenEmptyStateProps = {
  labels: KitchenLabels["empty"];
};

export function KitchenEmptyState({ labels }: KitchenEmptyStateProps) {
  return (
    <Card className="border-dashed border-border/70 bg-card/50">
      <CardHeader className="items-center text-center">
        <div className="grid size-14 place-items-center rounded-3xl border border-border bg-muted/40">
          <ChefHat className="size-7 text-muted-foreground" aria-hidden />
        </div>
        <CardTitle className="text-xl">{labels.title}</CardTitle>
        <CardDescription className="max-w-md">{labels.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex justify-center pb-8">
        <Button asChild>
          <Link href="/dashboard/orders">{labels.cta}</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
