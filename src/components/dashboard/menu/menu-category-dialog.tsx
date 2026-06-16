"use client";

import {
  TbDeviceFloppy,
  TbFolderPlus,
  TbLoader2,
  TbPhotoPlus,
  TbTrash,
  TbX,
} from "react-icons/tb";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  createMenuCategoryAction,
  deleteMenuCategoryAction,
  updateMenuCategoryAction,
  uploadMenuCategoryImageAction,
} from "@/app/actions/menu";
import type { ProductImagesFieldLabels } from "@/components/dashboard/product-images-field";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
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
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { MenuCategoryRecord } from "@/lib/menu/types";
import type { MenuPageLabels } from "./types";

const MAX_DESCRIPTION_LENGTH = 500;

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
  const isEditing = Boolean(category);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(90vh,720px)] flex-col gap-0 overflow-hidden p-0 sm:max-w-lg">
        <DialogHeader className="border-b border-border px-6 py-5">
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

        {open ? (
          <MenuCategoryFormFields
            key={category?.id ?? "new"}
            labels={labels}
            restaurantId={restaurantId}
            category={category}
            onOpenChange={onOpenChange}
            onCreated={onCreated}
            onUpdated={onUpdated}
            onDeleted={onDeleted}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function CategoryCoverImageField({
  labels,
  photoLabels,
  imageUrl,
  onChange,
  onUpload,
  disabled = false,
}: {
  labels: {
    cover: string;
    hint: string;
    changeImage: string;
  };
  photoLabels: ProductImagesFieldLabels;
  imageUrl: string | null;
  onChange: (imageUrl: string | null) => void;
  onUpload: (file: File) => Promise<string>;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setIsUploading(true);

    try {
      const url = await onUpload(file);
      onChange(url);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : photoLabels.uploadError;

      if (message === "INVALID_IMAGE_TYPE") {
        toast.error(photoLabels.invalidImageType);
      } else if (message === "IMAGE_TOO_LARGE") {
        toast.error(photoLabels.imageTooLarge);
      } else if (message === "R2_NOT_CONFIGURED") {
        toast.error(photoLabels.storageNotConfigured);
      } else {
        toast.error(photoLabels.uploadError);
      }
    } finally {
      setIsUploading(false);
      event.target.value = "";
    }
  }

  function openFilePicker() {
    if (!disabled && !isUploading) {
      inputRef.current?.click();
    }
  }

  return (
    <Field>
      <FieldLabel>{labels.cover}</FieldLabel>

      {imageUrl ? (
        <div className="space-y-3">
          <div className="relative aspect-2/1 overflow-hidden rounded-3xl border border-border bg-muted/30">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imageUrl} alt="" className="size-full object-cover" />
            {!disabled ? (
              <Button
                type="button"
                variant="secondary"
                size="icon-xs"
                className="absolute top-2 right-2 size-7 rounded-full"
                onClick={() => onChange(null)}
                aria-label={photoLabels.removePhoto}
              >
                <TbX className="size-4" aria-hidden />
              </Button>
            ) : null}
          </div>

          {!disabled ? (
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                className="rounded-2xl"
                onClick={openFilePicker}
                disabled={isUploading}
              >
                {isUploading ? (
                  <TbLoader2 className="size-4 animate-spin" aria-hidden />
                ) : null}
                {isUploading ? photoLabels.uploading : labels.changeImage}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="rounded-2xl"
                onClick={() => onChange(null)}
                disabled={isUploading}
              >
                {photoLabels.removePhoto}
              </Button>
            </div>
          ) : null}
        </div>
      ) : (
        <button
          type="button"
          className={cn(
            "flex aspect-2/1 w-full flex-col items-center justify-center gap-2 rounded-3xl border border-dashed border-border bg-muted/20 px-4 text-sm text-muted-foreground transition-colors hover:bg-muted/40",
            (disabled || isUploading) && "pointer-events-none opacity-60",
          )}
          onClick={openFilePicker}
          disabled={disabled || isUploading}
        >
          {isUploading ? (
            <TbLoader2 className="size-5 animate-spin" aria-hidden />
          ) : (
            <TbPhotoPlus className="size-5" aria-hidden />
          )}
          <span>
            {isUploading ? photoLabels.uploading : photoLabels.addPhoto}
          </span>
        </button>
      )}

      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
        {labels.hint}
      </p>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => void handleFileChange(event)}
      />
    </Field>
  );
}

function MenuCategoryFormFields({
  labels,
  restaurantId,
  category,
  onOpenChange,
  onCreated,
  onUpdated,
  onDeleted,
}: {
  labels: MenuPageLabels;
  restaurantId: string;
  category: MenuCategoryRecord | null;
  onOpenChange: (open: boolean) => void;
  onCreated: (category: MenuCategoryRecord) => void;
  onUpdated: (category: MenuCategoryRecord) => void;
  onDeleted: (categoryId: string) => void;
}) {
  const [name, setName] = useState(() => category?.name ?? "");
  const [description, setDescription] = useState(
    () => category?.description ?? "",
  );
  const [imageUrl, setImageUrl] = useState<string | null>(
    () => category?.imageUrl ?? null,
  );
  const [validationError, setValidationError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const isEditing = Boolean(category);

  const deleteDescription =
    category && category.itemCount > 0
      ? labels.categoryDialog.itemCountWarning.replace(
          "{count}",
          String(category.itemCount),
        )
      : labels.categoryDialog.confirmDelete;

  const isDirty = useMemo(() => {
    if (!category) {
      return (
        name.trim().length > 0 ||
        description.trim().length > 0 ||
        imageUrl !== null
      );
    }

    return (
      name.trim() !== category.name ||
      (description.trim() || null) !== (category.description ?? null) ||
      imageUrl !== (category.imageUrl ?? null)
    );
  }, [category, description, imageUrl, name]);

  async function handleUpload(file: File) {
    const formData = new FormData();
    formData.append("restaurantId", restaurantId);
    formData.append("file", file);

    const result = await uploadMenuCategoryImageAction(formData);

    return result.url;
  }

  async function handleSubmit(event?: React.FormEvent) {
    event?.preventDefault();

    const trimmedName = name.trim();
    const trimmedDescription = description.trim();

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
          description: trimmedDescription || null,
          imageUrl,
        });
        toast.success(labels.categoryDialog.successUpdate);
        onUpdated(result.category);
      } else {
        const result = await createMenuCategoryAction({
          restaurantId,
          name: trimmedName,
          description: trimmedDescription || undefined,
          imageUrl,
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

    setIsSubmitting(true);

    try {
      await deleteMenuCategoryAction({
        restaurantId,
        categoryId: category.id,
      });
      toast.success(labels.categoryDialog.successDelete);
      onDeleted(category.id);
      setConfirmDeleteOpen(false);
      onOpenChange(false);
    } catch {
      toast.error(labels.feedback.error);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <form
        className="flex min-h-0 flex-1 flex-col"
        onSubmit={(event) => void handleSubmit(event)}
      >
        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-6">
          {validationError ? (
            <div className="rounded-2xl bg-destructive/10 p-3 text-sm font-medium text-destructive">
              {validationError}
            </div>
          ) : null}

          <Field>
            <FieldLabel className="required">
              {labels.categoryDialog.name}
            </FieldLabel>
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

          <Field>
            <div className="mb-2 flex items-center justify-between gap-3">
              <FieldLabel className="mb-0">
                {labels.categoryDialog.description}
              </FieldLabel>
              <span
                className={cn(
                  "text-xs tabular-nums text-muted-foreground",
                  description.length > MAX_DESCRIPTION_LENGTH &&
                    "text-destructive",
                )}
              >
                {description.length}/{MAX_DESCRIPTION_LENGTH}
              </span>
            </div>
            <Textarea
              value={description}
              onChange={(event) =>
                setDescription(
                  event.target.value.slice(0, MAX_DESCRIPTION_LENGTH),
                )
              }
              placeholder={labels.categoryDialog.descriptionPlaceholder}
              className="min-h-24 resize-none rounded-3xl"
            />
          </Field>

          <CategoryCoverImageField
            labels={{
              cover: labels.categoryDialog.image,
              hint: labels.categoryDialog.imageHint,
              changeImage: labels.categoryDialog.changeImage,
            }}
            photoLabels={labels.photos}
            imageUrl={imageUrl}
            onChange={setImageUrl}
            onUpload={handleUpload}
            disabled={isSubmitting}
          />

          {isEditing && category ? (
            <Badge variant="secondary" className="rounded-full">
              {labels.item.itemCount.replace(
                "{count}",
                String(category.itemCount),
              )}
            </Badge>
          ) : null}
        </div>

        <DialogFooter className="border-t border-border px-6 py-4 sm:justify-between">
          {isEditing ? (
            <Button
              type="button"
              variant="ghost"
              className="rounded-2xl text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={() => setConfirmDeleteOpen(true)}
              disabled={isSubmitting}
            >
              <TbTrash className="size-4" aria-hidden />
              {labels.actions.delete}
            </Button>
          ) : (
            <span className="hidden sm:block" />
          )}

          <div className="flex flex-wrap justify-end gap-2">
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
              type="submit"
              className="rounded-2xl"
              disabled={isSubmitting || (isEditing && !isDirty)}
            >
              {isSubmitting ? (
                <TbLoader2 className="size-4 animate-spin" aria-hidden />
              ) : isEditing ? (
                <TbDeviceFloppy className="size-4" aria-hidden />
              ) : (
                <TbFolderPlus className="size-4" aria-hidden />
              )}
              {isSubmitting
                ? labels.actions.saving
                : isEditing
                  ? labels.actions.save
                  : labels.actions.create}
            </Button>
          </div>
        </DialogFooter>
      </form>

      <ConfirmDialog
        open={confirmDeleteOpen}
        onOpenChange={setConfirmDeleteOpen}
        title={labels.actions.delete}
        description={deleteDescription}
        confirmLabel={labels.actions.delete}
        cancelLabel={labels.actions.cancel}
        onConfirm={() => void handleDelete()}
        isPending={isSubmitting}
      />
    </>
  );
}
