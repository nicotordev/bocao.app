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
import type { CustomersLabels } from "./types";

type DeleteCustomerTarget = {
  id: string;
  name: string;
};

type DeleteCustomersConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  labels: CustomersLabels["deleteDialog"];
  customers: DeleteCustomerTarget[];
  isPending?: boolean;
  onConfirm: () => void;
};

export function DeleteCustomersConfirmDialog({
  open,
  onOpenChange,
  labels,
  customers,
  isPending = false,
  onConfirm,
}: DeleteCustomersConfirmDialogProps) {
  const isBulk = customers.length > 1;
  const customer = customers[0];

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {isBulk ? labels.titleBulk : labels.title}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isBulk
              ? labels.descriptionBulk.replace(
                  "{count}",
                  String(customers.length),
                )
              : labels.description.replace("{name}", customer?.name ?? "")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>
            {labels.cancel}
          </AlertDialogCancel>
          <Button
            type="button"
            variant="destructive"
            onClick={onConfirm}
            disabled={isPending || customers.length === 0}
          >
            {labels.confirm}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
