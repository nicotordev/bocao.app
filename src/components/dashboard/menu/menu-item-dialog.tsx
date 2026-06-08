"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  createMenuItemAction,
  updateMenuItemAction,
  uploadMenuItemImageAction,
} from "@/app/actions/menu";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { MenuCategoryRecord, MenuItemRecord } from "@/lib/menu/types";
import type { MenuItemTag } from "@/lib/menu/tag-types";
import type { MenuCustomTagRecord } from "@/lib/menu/custom-tags";
import { menuCustomTagsToMap } from "@/lib/menu/custom-tags";
import { mergeMenuItemTagsWithCustomDefinitions } from "@/lib/menu/tag-utils";
import {
  MenuItemTagsField,
  type MenuCatalogTagOption,
} from "./menu-item-tags-field";
import type {
  MenuItemFormValues,
  MenuLocaleOption,
  MenuPageLabels,
} from "./types";

type MenuItemDialogProps = {
  labels: MenuPageLabels;
  currency: string;
  restaurantId: string;
  categories: MenuCategoryRecord[];
  item: MenuItemRecord | null;
  catalogTags: MenuCatalogTagOption[];
  tagCatalogLabels: Record<string, string>;
  customTagDefinitions: MenuCustomTagRecord[];
  localeOptions: MenuLocaleOption[];
  tagSuggestions: MenuItemTag[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (
    item: MenuItemRecord,
    customTagDefinitions?: MenuCustomTagRecord[],
  ) => void;
};

const emptyForm = (): MenuItemFormValues => ({
  categoryId: "",
  name: "",
  description: "",
  price: "",
  isAvailable: true,
  images: [],
  tags: [],
});

export function MenuItemDialog({
  labels,
  currency,
  restaurantId,
  categories,
  item,
  catalogTags,
  tagCatalogLabels,
  customTagDefinitions,
  localeOptions,
  tagSuggestions,
  open,
  onOpenChange,
  onSuccess,
}: MenuItemDialogProps) {
  const customTagsByKey = menuCustomTagsToMap(customTagDefinitions);
  const [form, setForm] = useState<MenuItemFormValues>(emptyForm);
  const [validationError, setValidationError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const photoLabels: ProductImagesFieldLabels = labels.photos;
  const isEditing = Boolean(item);

  useEffect(() => {
    if (item) {
      setForm({
        categoryId: item.categoryId,
        name: item.name,
        description: item.description ?? "",
        price: String(item.priceCents / 100),
        isAvailable: item.isAvailable,
        images: item.images,
        tags: mergeMenuItemTagsWithCustomDefinitions(
          item.tags,
          customTagsByKey,
        ),
      });
    } else {
      setForm({
        ...emptyForm(),
        categoryId: categories[0]?.id ?? "",
      });
    }
    setValidationError("");
  }, [item, open, categories, customTagDefinitions]);

  function updateField<K extends keyof MenuItemFormValues>(
    field: K,
    value: MenuItemFormValues[K],
  ) {
    setForm((current) => ({ ...current, [field]: value }));
    setValidationError("");
  }

  async function handleUpload(file: File) {
    const formData = new FormData();
    formData.append("restaurantId", restaurantId);
    formData.append("file", file);

    const result = await uploadMenuItemImageAction(formData);
    return result.url;
  }

  async function handleSubmit() {
    const name = form.name.trim();

    if (!name) {
      setValidationError(labels.validation.name);
      return;
    }

    if (!form.categoryId) {
      setValidationError(labels.validation.category);
      return;
    }

    const priceNum = Number.parseFloat(form.price);
    if (Number.isNaN(priceNum) || priceNum < 0) {
      setValidationError(labels.validation.price);
      return;
    }

    const priceCents = Math.round(priceNum * 100);
    setIsSubmitting(true);

    try {
      if (item) {
        const result = await updateMenuItemAction({
          restaurantId,
          menuItemId: item.id,
          categoryId: form.categoryId,
          name,
          description: form.description.trim() || null,
          priceCents,
          isAvailable: form.isAvailable,
          images: form.images,
          tags: form.tags,
        });
        toast.success(labels.itemDialog.successUpdate);
        onSuccess(result.item, result.customTagDefinitions);
      } else {
        const result = await createMenuItemAction({
          restaurantId,
          categoryId: form.categoryId,
          name,
          description: form.description.trim() || undefined,
          priceCents,
          isAvailable: form.isAvailable,
          images: form.images,
          tags: form.tags,
        });
        toast.success(labels.itemDialog.successCreate);
        onSuccess(result.item, result.customTagDefinitions);
      }

      onOpenChange(false);
    } catch {
      toast.error(labels.feedback.error);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(90vh,720px)] max-w-lg flex-col gap-0 overflow-hidden p-0">
        <DialogHeader className="border-b border-border px-6 py-5">
          <DialogTitle>
            {isEditing ? labels.itemDialog.editTitle : labels.itemDialog.createTitle}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? labels.itemDialog.editDescription
              : labels.itemDialog.createDescription}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 space-y-5 overflow-y-auto p-6">
          {validationError ? (
            <div className="rounded-2xl bg-destructive/10 p-3 text-sm font-medium text-destructive">
              {validationError}
            </div>
          ) : null}

          <Field>
            <FieldLabel className="required">{labels.itemDialog.name}</FieldLabel>
            <Input
              value={form.name}
              onChange={(event) => updateField("name", event.target.value)}
              placeholder={labels.itemDialog.namePlaceholder}
              className="rounded-3xl"
              autoFocus
            />
          </Field>

          <Field>
            <FieldLabel>{labels.itemDialog.description}</FieldLabel>
            <Textarea
              value={form.description}
              onChange={(event) => updateField("description", event.target.value)}
              placeholder={labels.itemDialog.descriptionPlaceholder}
              className="min-h-24 rounded-3xl"
            />
          </Field>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field>
              <FieldLabel className="required">{labels.itemDialog.price}</FieldLabel>
              <InputGroup>
                <InputGroupAddon align="inline-start">
                  <InputGroupText>{currency}</InputGroupText>
                </InputGroupAddon>
                <InputGroupInput
                  type="number"
                  min={0}
                  value={form.price}
                  onChange={(event) => updateField("price", event.target.value)}
                  placeholder="0"
                />
              </InputGroup>
            </Field>

            <Field>
              <FieldLabel className="required">{labels.itemDialog.category}</FieldLabel>
              <Select
                value={form.categoryId || undefined}
                onValueChange={(value) => updateField("categoryId", value)}
              >
                <SelectTrigger className="rounded-3xl">
                  <SelectValue placeholder={labels.itemDialog.categoryPlaceholder} />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id} className="rounded-lg">
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-border px-3 py-2">
            <Switch
              id="menu-item-available"
              checked={form.isAvailable}
              onCheckedChange={(checked) => updateField("isAvailable", checked)}
            />
            <FieldLabel htmlFor="menu-item-available" className="cursor-pointer">
              {labels.itemDialog.available}
            </FieldLabel>
          </div>

          <MenuItemTagsField
            labels={{
              label: labels.itemDialog.tags,
              catalog: labels.itemDialog.tagsCatalog,
              customLabel: labels.itemDialog.tagsCustom,
              customPlaceholder: labels.itemDialog.tagsPlaceholder,
              add: labels.itemDialog.tagsAdd,
              remove: labels.itemDialog.tagsRemove,
              suggestions: labels.itemDialog.tagsSuggestions,
              pickIcon: labels.itemDialog.tagsPickIcon,
              languages: labels.itemDialog.tagsLanguages,
            }}
            localeOptions={localeOptions}
            catalogTags={catalogTags}
            catalogLabels={tagCatalogLabels}
            customTagDefinitions={customTagDefinitions}
            value={form.tags}
            suggestions={tagSuggestions}
            onChange={(tags) => updateField("tags", tags)}
          />

          <div>
            <p className="mb-2 text-sm font-medium">{labels.item.photos}</p>
            <ProductImagesField
              labels={photoLabels}
              imageUrls={form.images}
              onChange={(images) => updateField("images", images)}
              onUpload={handleUpload}
            />
          </div>
        </div>

        <DialogFooter className="border-t border-border px-6 py-4">
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
            disabled={isSubmitting || categories.length === 0}
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
