"use client";

import { useEffect, useState } from "react";
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
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { KitchenStationCategory } from "@/lib/kitchen/stations/types";
import type { KitchenStationWithStats } from "@/lib/kitchen/stations/types";
import type { KitchenStationsLabels } from "./types";

const categoryOptions: KitchenStationCategory[] = [
  "grill",
  "fryer",
  "sushi",
  "bar",
  "desserts",
  "delivery",
  "prep",
  "other",
];

type KitchenStationFormDialogProps = {
  labels: KitchenStationsLabels;
  station: KitchenStationWithStats | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: {
    name: string;
    description: string;
    category: KitchenStationCategory;
    isActive: boolean;
    sortOrder?: number;
  }) => Promise<void>;
  isSubmitting?: boolean;
};

export function KitchenStationFormDialog({
  labels,
  station,
  open,
  onOpenChange,
  onSubmit,
  isSubmitting = false,
}: KitchenStationFormDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<KitchenStationCategory>("grill");
  const [isActive, setIsActive] = useState(true);
  const [sortOrder, setSortOrder] = useState("");
  const [validationError, setValidationError] = useState("");

  const isEditing = Boolean(station);

  useEffect(() => {
    setName(station?.name ?? "");
    setDescription(station?.description ?? "");
    setCategory(station?.category ?? "grill");
    setIsActive(station?.isActive ?? true);
    setSortOrder(station ? String(station.sortOrder + 1) : "");
    setValidationError("");
  }, [station, open]);

  async function handleSubmit() {
    const trimmedName = name.trim();

    if (!trimmedName) {
      setValidationError(labels.validation.name);
      return;
    }

    const parsedSortOrder = sortOrder.trim()
      ? Number.parseInt(sortOrder, 10)
      : undefined;

    if (
      sortOrder.trim() &&
      (Number.isNaN(parsedSortOrder) || (parsedSortOrder ?? 0) < 1)
    ) {
      return;
    }

    try {
      await onSubmit({
        name: trimmedName,
        description: description.trim(),
        category,
        isActive,
        sortOrder:
          parsedSortOrder !== undefined ? parsedSortOrder - 1 : undefined,
      });
      onOpenChange(false);
    } catch {
      toast.error(labels.feedback.error);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? labels.form.editTitle : labels.form.createTitle}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? labels.form.editDescription
              : labels.form.createDescription}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <Field>
            <FieldLabel htmlFor="station-name">{labels.form.name}</FieldLabel>
            <Input
              id="station-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder={labels.form.namePlaceholder}
              autoFocus
            />
            {validationError ? (
              <p className="text-sm text-destructive">{validationError}</p>
            ) : null}
          </Field>

          <Field>
            <FieldLabel htmlFor="station-description">
              {labels.form.description}
            </FieldLabel>
            <Textarea
              id="station-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder={labels.form.descriptionPlaceholder}
              rows={3}
            />
          </Field>

          <Field>
            <FieldLabel>{labels.form.category}</FieldLabel>
            <Select
              value={category}
              onValueChange={(value) =>
                setCategory(value as KitchenStationCategory)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder={labels.form.categoryPlaceholder} />
              </SelectTrigger>
              <SelectContent>
                {categoryOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {labels.categories[option]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field>
            <FieldLabel htmlFor="station-sort-order">
              {labels.form.sortOrder}
            </FieldLabel>
            <Input
              id="station-sort-order"
              type="number"
              min={1}
              value={sortOrder}
              onChange={(event) => setSortOrder(event.target.value)}
              placeholder="1"
            />
            <FieldDescription>{labels.form.sortOrderHint}</FieldDescription>
          </Field>

          <Field orientation="horizontal">
            <div className="flex flex-1 flex-col gap-1">
              <FieldLabel htmlFor="station-active">
                {labels.form.isActive}
              </FieldLabel>
              <FieldDescription>{labels.form.isActiveHint}</FieldDescription>
            </div>
            <Switch
              id="station-active"
              checked={isActive}
              onCheckedChange={setIsActive}
            />
          </Field>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            {labels.form.cancel}
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? labels.form.saving : labels.form.save}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
