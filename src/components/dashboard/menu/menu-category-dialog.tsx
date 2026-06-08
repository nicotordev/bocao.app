"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  createMenuCategoryAction,
  deleteMenuCategoryAction,
  updateMenuCategoryAction,
} from "@/app/actions/menu";
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
import type { MenuCategoryRecord } from "@/lib/menu/types";
import type { MenuPageLabels } from "./types";

type MenuCategoryDialogProps = {
  labels: MenuPageLabels;
  restaurantId: string;
  category: MenuCategoryRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (category: MenuCategoryRecord) => void;
  onUpdated: (category: MenuCategoryRecord) => void;
  onDeleted: (categoryId: string) => void;
};

export function MenuCategoryDialog({
  labels,
  restaurantId,
  category,
  open,
  onOpenChange,
  onCreated,
  onUpdated,
  onDeleted,
}: MenuCategoryDialogProps) {
  const [name, setName] = useState("");
  const [validationError, setValidationError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditing = Boolean(category);

  useEffect(() => {
    setName(category?.name ?? "");
    setValidationError("");
  }, [category, open]);

  async function handleSubmit() {
    const trimmedName = name.trim();

    if (!trimmedName) {
      setValidationError(labels.validation.name);
      return;
    }

    setIsSubmitting(true);

    try {
      if (category) {
        const result = await updateMenuCategoryAction({
          restaurantId,
          categoryId: category.id,
          name: trimmedName,
        });
        toast.success(labels.categoryDialog.successUpdate);
        onUpdated(result.category);
      } else {
        const result = await createMenuCategoryAction({
          restaurantId,
          name: trimmedName,
        });
        toast.success(labels.categoryDialog.successCreate);
        onCreated(result.category);
      }

      onOpenChange(false);
    } catch {
      toast.error(labels.feedback.error);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!category) {
      return;
    }

    const warning =
      category.itemCount > 0
        ? labels.categoryDialog.itemCountWarning.replace(
            "{count}",
            String(category.itemCount),
          )
        : labels.categoryDialog.confirmDelete;

    if (!window.confirm(warning)) {
      return;
    }

    setIsSubmitting(true);

    try {
      await deleteMenuCategoryAction({
        restaurantId,
        categoryId: category.id,
      });
      toast.success(labels.categoryDialog.successDelete);
      onDeleted(category.id);
      onOpenChange(false);
    } catch {
      toast.error(labels.feedback.error);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-3xl">
        <DialogHeader>
          <DialogTitle>
            {isEditing
              ? labels.categoryDialog.editTitle
              : labels.categoryDialog.createTitle}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? labels.categoryDialog.editDescription
              : labels.categoryDialog.createDescription}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {validationError ? (
            <div className="rounded-2xl bg-destructive/10 p-3 text-sm font-medium text-destructive">
              {validationError}
            </div>
          ) : null}

          <Field>
            <FieldLabel className="required">{labels.categoryDialog.name}</FieldLabel>
            <Input
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                setValidationError("");
              }}
              placeholder={labels.categoryDialog.namePlaceholder}
              className="rounded-3xl"
              autoFocus
            />
          </Field>
        </div>

        <DialogFooter className="flex gap-2 pt-2">
          {isEditing ? (
            <Button
              type="button"
              variant="destructive"
              className="rounded-2xl"
              onClick={() => void handleDelete()}
              disabled={isSubmitting}
            >
              {labels.actions.delete}
            </Button>
          ) : null}
          <Button
            type="button"
            variant="outline"
            className="rounded-2xl"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            {labels.actions.cancel}
          </Button>
          <Button
            type="button"
            className="rounded-2xl"
            onClick={() => void handleSubmit()}
            disabled={isSubmitting}
          >
            {isSubmitting
              ? labels.actions.saving
              : isEditing
                ? labels.actions.save
                : labels.actions.create}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
