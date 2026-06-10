"use client";

import {
  TbMinus,
  TbPlus,
} from "react-icons/tb";
import { useState } from "react";
import { toast } from "sonner";
import { uploadOrderItemImageAction } from "@/app/actions/menu";
import {
  ProductImagesField,
  type ProductImagesFieldLabels,
} from "@/components/dashboard/product-images-field";
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
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group";
import type { NewOrderLabels } from "./types";

type CustomProductDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  labels: NewOrderLabels;
  currency: string;
  restaurantId: string;
  onAddCustom: (
    name: string,
    priceCents: number,
    quantity: number,
    imageUrls: string[],
  ) => void;
};

export function CustomProductDialog({
  open,
  onOpenChange,
  labels,
  currency,
  restaurantId,
  onAddCustom,
}: CustomProductDialogProps) {
  const [customName, setCustomName] = useState("");
  const [customPrice, setCustomPrice] = useState("");
  const [customQuantity, setCustomQuantity] = useState(1);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [validationError, setValidationError] = useState("");

  const photoLabels: ProductImagesFieldLabels = labels.photos;

  function resetForm() {
    setCustomName("");
    setCustomPrice("");
    setCustomQuantity(1);
    setImageUrls([]);
    setValidationError("");
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      resetForm();
    }
    onOpenChange(nextOpen);
  }

  async function uploadLineItemImage(file: File) {
    const formData = new FormData();
    formData.append("restaurantId", restaurantId);
    formData.append("file", file);

    const result = await uploadOrderItemImageAction(formData);
    return result.url;
  }

  function handleAddCustomProduct() {
    const trimmedName = customName.trim();
    if (!trimmedName) {
      setValidationError(labels.validation.itemName);
      return;
    }

    const priceNum = Number.parseFloat(customPrice);
    if (Number.isNaN(priceNum) || priceNum < 0) {
      setValidationError(labels.validation.itemPrice);
      return;
    }

    const priceCents = Math.round(priceNum * 100);

    onAddCustom(trimmedName, priceCents, customQuantity, imageUrls);
    resetForm();
    onOpenChange(false);
    toast.success(labels.items.picker.addCustomSuccess);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="flex max-h-[min(90vh,720px)] flex-col gap-0 overflow-hidden p-0 sm:max-w-lg">
        <DialogHeader className="border-b border-border px-6 py-5">
          <DialogTitle>{labels.items.picker.customProductTitle}</DialogTitle>
          <DialogDescription>
            {labels.items.picker.customProductDescription}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {validationError ? (
              <div className="rounded-2xl bg-destructive/10 p-3 text-sm font-medium text-destructive">
                {validationError}
              </div>
            ) : null}

            <Field>
              <FieldLabel className="required">
                {labels.items.picker.customNameLabel}
              </FieldLabel>
              <Input
                value={customName}
                onChange={(event) => {
                  setCustomName(event.target.value);
                  setValidationError("");
                }}
                placeholder={labels.items.picker.customNamePlaceholder}
                className="rounded-3xl"
              />
            </Field>

            <div className="grid gap-6 sm:grid-cols-2">
              <Field>
                <FieldLabel className="required">
                  {labels.items.picker.customPriceLabel}
                </FieldLabel>
                <InputGroup>
                  <InputGroupAddon align="inline-start">
                    <InputGroupText>{currency}</InputGroupText>
                  </InputGroupAddon>
                  <InputGroupInput
                    type="number"
                    min={0}
                    value={customPrice}
                    onChange={(event) => {
                      setCustomPrice(event.target.value);
                      setValidationError("");
                    }}
                    placeholder="0"
                  />
                </InputGroup>
              </Field>

              <Field>
                <FieldLabel>{labels.items.picker.customQuantityLabel}</FieldLabel>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon-sm"
                    onClick={() => setCustomQuantity((quantity) => Math.max(1, quantity - 1))}
                    aria-label={labels.actions.removeItem}
                  >
                    <TbMinus className="size-4" aria-hidden />
                  </Button>
                  <Input
                    type="number"
                    min={1}
                    max={99}
                    value={customQuantity}
                    onChange={(event) => {
                      const next = Number.parseInt(event.target.value, 10);
                      if (!Number.isNaN(next)) {
                        setCustomQuantity(Math.min(99, Math.max(1, next)));
                      }
                    }}
                    className="rounded-3xl text-center"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon-sm"
                    onClick={() => setCustomQuantity((quantity) => Math.min(99, quantity + 1))}
                    aria-label={labels.actions.addItem}
                  >
                    <TbPlus className="size-4" aria-hidden />
                  </Button>
                </div>
              </Field>
            </div>

            <Field>
              <FieldLabel>{labels.items.photos}</FieldLabel>
              <ProductImagesField
                labels={photoLabels}
                imageUrls={imageUrls}
                onChange={setImageUrls}
                variant="gallery"
                onUpload={uploadLineItemImage}
              />
            </Field>
          </div>
        </div>

        <DialogFooter className="border-t border-border px-6 py-4">
          <Button type="button" onClick={handleAddCustomProduct}>
            <TbPlus className="mr-2 size-4" />
            {labels.items.picker.addProduct}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
