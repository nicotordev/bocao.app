"use client";

import { Sparkles } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { KitchenLabels } from "./types";

type KitchenCopilotDialogProps = {
  labels: KitchenLabels["copilot"];
  actionLabel: string;
  items: readonly string[];
};

export function KitchenCopilotDialog({
  labels,
  actionLabel,
  items,
}: KitchenCopilotDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button type="button" className="gap-2" onClick={() => setOpen(true)}>
        <Sparkles className="size-4" aria-hidden />
        {actionLabel}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        {open ? (
          <DialogContent className="flex max-h-[min(90vh,820px)] flex-col gap-0 overflow-hidden p-0 sm:max-w-4xl">
            <DialogHeader className="shrink-0 border-b border-border px-6 py-5">
              <DialogTitle>{labels.title}</DialogTitle>
              <DialogDescription>{labels.subtitle}</DialogDescription>
            </DialogHeader>

            {items.length > 0 ? (
              <div className="min-h-0 flex-1 overflow-y-auto">
                <ul className="flex flex-col gap-3 p-4">
                  {items.map((item) => (
                    <li
                      key={item}
                      className="rounded-3xl border border-border bg-card px-4 py-4 text-sm leading-relaxed"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 text-center">
                <p className="font-medium">{labels.emptyTitle}</p>
                <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                  {labels.emptyDescription}
                </p>
              </div>
            )}

            <DialogFooter className="shrink-0 border-t border-border px-6 py-4">
              <p className="text-sm text-muted-foreground">
                {labels.footerHint}
              </p>
            </DialogFooter>
          </DialogContent>
        ) : null}
      </Dialog>
    </>
  );
}
