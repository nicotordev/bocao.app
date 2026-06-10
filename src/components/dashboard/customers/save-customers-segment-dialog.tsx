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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { CustomerSavedSegmentSummary } from "@/lib/customers/saved-segments.types";
import {
  useAddSavedCustomerSegmentMembersMutation,
  useCreateSavedCustomerSegmentMutation,
} from "@/lib/query/customers/saved-segments.mutations";
import type { CustomersLabels } from "./types";

type SaveCustomersSegmentDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  labels: CustomersLabels["savedSegments"];
  restaurantId: string;
  customerIds: string[];
  savedSegments: CustomerSavedSegmentSummary[];
  onSuccess: () => void;
};

export function SaveCustomersSegmentDialog({
  open,
  onOpenChange,
  labels,
  restaurantId,
  customerIds,
  savedSegments,
  onSuccess,
}: SaveCustomersSegmentDialogProps) {
  const [mode, setMode] = useState<"new" | "existing">("new");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [existingSegmentId, setExistingSegmentId] = useState("");

  const createMutation = useCreateSavedCustomerSegmentMutation(restaurantId);
  const addMembersMutation =
    useAddSavedCustomerSegmentMembersMutation(restaurantId);
  const isPending = createMutation.isPending || addMembersMutation.isPending;

  const resolvedExistingSegmentId =
    mode === "existing"
      ? existingSegmentId &&
        savedSegments.some((segment) => segment.id === existingSegmentId)
        ? existingSegmentId
        : (savedSegments[0]?.id ?? "")
      : "";

  function resetForm() {
    setMode("new");
    setName("");
    setDescription("");
    setExistingSegmentId("");
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      resetForm();
    }

    onOpenChange(nextOpen);
  }

  async function handleSubmit() {
    if (customerIds.length === 0) {
      toast.error(labels.noCustomersSelected);
      return;
    }

    try {
      if (mode === "existing") {
        if (!resolvedExistingSegmentId) {
          toast.error(labels.selectSegment);
          return;
        }

        await addMembersMutation.mutateAsync({
          segmentId: resolvedExistingSegmentId,
          customerIds,
        });
        toast.success(labels.addedToExisting);
      } else {
        const trimmedName = name.trim();

        if (!trimmedName) {
          toast.error(labels.nameRequired);
          return;
        }

        await createMutation.mutateAsync({
          name: trimmedName,
          description: description.trim() || undefined,
          customerIds,
        });
        toast.success(labels.created);
      }

      handleOpenChange(false);
      onSuccess();
    } catch {
      toast.error(labels.saveError);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{labels.saveTitle}</DialogTitle>
          <DialogDescription>
            {labels.saveDescription.replace(
              "{count}",
              String(customerIds.length),
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>{labels.saveMode}</Label>
            <Select
              value={mode}
              onValueChange={(value) => {
                const nextMode = value as "new" | "existing";
                setMode(nextMode);

                if (nextMode === "existing" && savedSegments.length > 0) {
                  setExistingSegmentId(
                    (current) => current || (savedSegments[0]?.id ?? ""),
                  );
                }
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="new">{labels.createNew}</SelectItem>
                <SelectItem
                  value="existing"
                  disabled={savedSegments.length === 0}
                >
                  {labels.addToExisting}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {mode === "new" ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="segment-name">{labels.name}</Label>
                <Input
                  id="segment-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder={labels.namePlaceholder}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="segment-description">
                  {labels.description}
                </Label>
                <Textarea
                  id="segment-description"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder={labels.descriptionPlaceholder}
                  rows={3}
                />
              </div>
            </>
          ) : (
            <div className="space-y-2">
              <Label>{labels.segment}</Label>
              <Select
                value={resolvedExistingSegmentId}
                onValueChange={setExistingSegmentId}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={labels.selectSegment} />
                </SelectTrigger>
                <SelectContent>
                  {savedSegments.map((segment) => (
                    <SelectItem key={segment.id} value={segment.id}>
                      {segment.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isPending}
          >
            {labels.cancel}
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={isPending}>
            {labels.save}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
