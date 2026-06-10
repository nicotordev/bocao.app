"use client";

import { useEffect, useState } from "react";
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
import { Input } from "@/components/ui/input";

type PromptDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  label: string;
  placeholder?: string;
  defaultValue?: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: (value: string) => void;
  isPending?: boolean;
  required?: boolean;
};

export function PromptDialog({
  open,
  onOpenChange,
  title,
  description,
  label,
  placeholder,
  defaultValue = "",
  confirmLabel,
  cancelLabel,
  onConfirm,
  isPending = false,
  required = true,
}: PromptDialogProps) {
  const [value, setValue] = useState(defaultValue);

  useEffect(() => {
    if (open) {
      setValue(defaultValue);
    }
  }, [defaultValue, open]);

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen && !isPending) {
      setValue(defaultValue);
    }

    onOpenChange(nextOpen);
  }

  function handleSubmit() {
    const trimmed = value.trim();

    if (required && !trimmed) {
      return;
    }

    onConfirm(trimmed);
  }

  const canSubmit = !required || value.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="rounded-4xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? (
            <DialogDescription>{description}</DialogDescription>
          ) : null}
        </DialogHeader>
        <Field>
          <FieldLabel>{label}</FieldLabel>
          <Input
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder={placeholder}
            className="rounded-2xl"
            autoFocus
            onKeyDown={(event) => {
              if (event.key === "Enter" && canSubmit && !isPending) {
                event.preventDefault();
                handleSubmit();
              }
            }}
          />
        </Field>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            className="rounded-2xl"
            onClick={() => handleOpenChange(false)}
            disabled={isPending}
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            className="rounded-2xl"
            onClick={handleSubmit}
            disabled={isPending || !canSubmit}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
