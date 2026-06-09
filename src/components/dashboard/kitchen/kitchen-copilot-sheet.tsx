"use client";

import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import type { KitchenLabels } from "./types";

type KitchenCopilotSheetProps = {
  labels: KitchenLabels["copilot"];
  actionLabel: string;
  items: readonly string[];
};

export function KitchenCopilotSheet({
  labels,
  actionLabel,
  items,
}: KitchenCopilotSheetProps) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Sparkles className="size-4" aria-hidden />
          {actionLabel}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{labels.title}</SheetTitle>
          <SheetDescription>{labels.subtitle}</SheetDescription>
        </SheetHeader>
        <ul className="mt-6 space-y-3">
          {items.map((item) => (
            <li
              key={item}
              className="rounded-2xl border border-border/60 bg-muted/20 px-4 py-3 text-sm leading-relaxed"
            >
              {item}
            </li>
          ))}
        </ul>
      </SheetContent>
    </Sheet>
  );
}
