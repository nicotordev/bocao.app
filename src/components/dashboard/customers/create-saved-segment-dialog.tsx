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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { CustomerSavedSegmentSummary } from "@/lib/customers/saved-segments.types";
import { useCreateSavedCustomerSegmentMutation } from "@/lib/query/customers/saved-segments.mutations";
import type { CustomersLabels } from "./types";

type CreateSavedSegmentDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  labels: CustomersLabels["savedSegments"];
  restaurantId: string;
  onSuccess: (segment: CustomerSavedSegmentSummary) => void;
};

export function CreateSavedSegmentDialog({
  open,
  onOpenChange,
  labels,
  restaurantId,
  onSuccess,
}: CreateSavedSegmentDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const createMutation = useCreateSavedCustomerSegmentMutation(restaurantId);

  useEffect(() => {
    if (!open) {
      setName("");
      setDescription("");
    }
  }, [open]);

  async function handleSubmit() {
    const trimmedName = name.trim();

    if (!trimmedName) {
      toast.error(labels.nameRequired);
      return;
    }

    try {
      const segment = await createMutation.mutateAsync({
        name: trimmedName,
        description: description.trim() || undefined,
      });
      toast.success(labels.created);
      onOpenChange(false);
      onSuccess(segment);
    } catch {
      toast.error(labels.saveError);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{labels.createTitle}</DialogTitle>
          <DialogDescription>{labels.createDescription}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="create-segment-name">{labels.name}</Label>
            <Input
              id="create-segment-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder={labels.namePlaceholder}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="create-segment-description">
              {labels.description}
            </Label>
            <Textarea
              id="create-segment-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder={labels.descriptionPlaceholder}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={createMutation.isPending}
          >
            {labels.cancel}
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={createMutation.isPending}
          >
            {labels.create}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
