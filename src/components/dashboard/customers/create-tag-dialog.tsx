"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type { CustomerTagSummary } from "@/lib/customers/tags.types";
import {
  CUSTOMER_TAG_COLORS,
  TagColorPicker,
} from "./tag-color-picker";

export type CreateTagDialogLabels = {
  title: string;
  name: string;
  namePlaceholder: string;
  color: string;
  create: string;
  cancel: string;
  nameRequired: string;
};

type CreateTagDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  labels: CreateTagDialogLabels;
  isPending?: boolean;
  onCreate: (input: { name: string; color: string }) => Promise<CustomerTagSummary>;
};

export function CreateTagDialog({
  open,
  onOpenChange,
  labels,
  isPending = false,
  onCreate,
}: CreateTagDialogProps) {
  const [name, setName] = useState("");
  const [color, setColor] = useState<string>(CUSTOMER_TAG_COLORS[0]);
  const [error, setError] = useState("");

  function resetDraft() {
    setName("");
    setColor(CUSTOMER_TAG_COLORS[0]);
    setError("");
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      resetDraft();
    }

    onOpenChange(nextOpen);
  }

  async function handleCreate() {
    const trimmedName = name.trim();

    if (!trimmedName) {
      setError(labels.nameRequired);
      return;
    }

    await onCreate({ name: trimmedName, color });
    resetDraft();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{labels.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {error ? (
            <p className="text-sm font-medium text-destructive">{error}</p>
          ) : null}

          <Field>
            <FieldLabel>{labels.name}</FieldLabel>
            <Input
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                setError("");
              }}
              placeholder={labels.namePlaceholder}
              className="rounded-3xl"
              autoFocus
            />
          </Field>

          <TagColorPicker
            label={labels.color}
            value={color}
            onChange={setColor}
          />
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            {labels.cancel}
          </Button>
          <Button
            type="button"
            onClick={() => void handleCreate()}
            disabled={isPending}
          >
            {labels.create}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
