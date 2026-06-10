"use client";

import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { KitchenLabels } from "./types";

type CancelKitchenOrderDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  labels: KitchenLabels["cancelDialog"];
  orderNumber: string | null;
  isPending?: boolean;
  onConfirm: () => void;
};

export function CancelKitchenOrderDialog({
  open,
  onOpenChange,
  labels,
  orderNumber,
  isPending = false,
  onConfirm,
}: CancelKitchenOrderDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{labels.title}</AlertDialogTitle>
          <AlertDialogDescription>
            {labels.description.replace("{number}", orderNumber ?? "")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>
            {labels.cancel}
          </AlertDialogCancel>
          <Button
            variant="destructive"
            disabled={isPending}
            onClick={onConfirm}
          >
            {labels.confirm}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
