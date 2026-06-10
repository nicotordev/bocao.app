"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  useComboboxAnchor,
} from "@/components/ui/combobox";
import type { BulkCustomerTagOperation } from "@/lib/customers/tags.types";
import type { CustomerTagSummary } from "@/lib/customers/tags.types";
import { CustomerTagBadge } from "./customer-tag-badge";

export type BulkCustomerTagsDialogLabels = {
  addTitle: string;
  removeTitle: string;
  addDescription: string;
  removeDescription: string;
  tags: string;
  searchPlaceholder: string;
  noResults: string;
  confirmAdd: string;
  confirmRemove: string;
  cancel: string;
  successAdd: string;
  successRemove: string;
  error: string;
};

type BulkCustomerTagsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  operation: BulkCustomerTagOperation;
  labels: BulkCustomerTagsDialogLabels;
  tags: CustomerTagSummary[];
  customerCount: number;
  isPending?: boolean;
  onConfirm: (tagIds: string[]) => Promise<void>;
};

export function BulkCustomerTagsDialog({
  open,
  onOpenChange,
  operation,
  labels,
  tags,
  customerCount,
  isPending = false,
  onConfirm,
}: BulkCustomerTagsDialogProps) {
  const anchorRef = useComboboxAnchor();
  const [selectedTags, setSelectedTags] = useState<CustomerTagSummary[]>([]);

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      setSelectedTags([]);
    }

    onOpenChange(nextOpen);
  }

  const title = operation === "add" ? labels.addTitle : labels.removeTitle;
  const description = (
    operation === "add" ? labels.addDescription : labels.removeDescription
  ).replace("{count}", String(customerCount));

  const confirmLabel =
    operation === "add" ? labels.confirmAdd : labels.confirmRemove;

  async function handleConfirm() {
    if (selectedTags.length === 0) {
      return;
    }

    try {
      await onConfirm(selectedTags.map((tag) => tag.id));
      toast.success(
        operation === "add" ? labels.successAdd : labels.successRemove,
      );
      handleOpenChange(false);
    } catch {
      toast.error(labels.error);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <Field>
          <FieldLabel>{labels.tags}</FieldLabel>
          <Combobox
            multiple
            items={tags}
            value={selectedTags}
            onValueChange={(nextValue) => {
              setSelectedTags(nextValue ?? []);
            }}
            itemToStringLabel={(tag) => tag.name}
            isItemEqualToValue={(item, value) => item.id === value.id}
          >
            <ComboboxChips ref={anchorRef} className="w-full rounded-3xl">
              {selectedTags.map((tag) => (
                <ComboboxChip key={tag.id} aria-label={tag.name}>
                  <CustomerTagBadge tag={tag} />
                </ComboboxChip>
              ))}
              <ComboboxChipsInput placeholder={labels.searchPlaceholder} />
            </ComboboxChips>
            <ComboboxContent anchor={anchorRef}>
              <ComboboxEmpty>{labels.noResults}</ComboboxEmpty>
              <ComboboxList>
                {(tag) => (
                  <ComboboxItem key={tag.id} value={tag}>
                    <CustomerTagBadge tag={tag} />
                  </ComboboxItem>
                )}
              </ComboboxList>
            </ComboboxContent>
          </Combobox>
        </Field>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isPending}
          >
            {labels.cancel}
          </Button>
          <Button
            type="button"
            onClick={() => void handleConfirm()}
            disabled={isPending || selectedTags.length === 0}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
