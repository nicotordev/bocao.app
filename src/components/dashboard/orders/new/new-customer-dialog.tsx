"use client";

import { Plus } from "lucide-react";
import { useId, useState } from "react";
import { toast } from "sonner";
import { uploadCustomerAvatarAction } from "@/app/actions/customers";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { Textarea } from "@/components/ui/textarea";
import { getCustomerInitials } from "@/lib/customers/format";
import type { CustomerFormDialogLabels } from "@/lib/customers/customer-form-labels";
import type { NewOrderNewCustomerInput } from "./types";

type NewCustomerDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  labels: CustomerFormDialogLabels;
  restaurantId?: string;
  onAddCustomer: (
    customer: NewOrderNewCustomerInput,
  ) => void | Promise<void>;
};

const emptyForm: NewOrderNewCustomerInput = {
  name: "",
  phone: "",
  email: "",
  documentId: "",
  address: "",
  notes: "",
  avatar: "",
};

export function NewCustomerDialog({
  open,
  onOpenChange,
  labels,
  restaurantId,
  onAddCustomer,
}: NewCustomerDialogProps) {
  const avatarInputId = useId();
  const [form, setForm] = useState<NewOrderNewCustomerInput>(emptyForm);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [validationError, setValidationError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const showAvatarField = Boolean(labels.avatar && restaurantId);
  const avatarLabels = labels.avatar;

  function clearAvatarPreview() {
    if (avatarPreview.startsWith("blob:")) {
      URL.revokeObjectURL(avatarPreview);
    }
  }

  function resetForm() {
    setForm(emptyForm);
    setAvatarFile(null);
    clearAvatarPreview();
    setAvatarPreview("");
    setValidationError("");
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      resetForm();
    }
    onOpenChange(nextOpen);
  }

  function updateField<K extends keyof NewOrderNewCustomerInput>(
    field: K,
    value: NewOrderNewCustomerInput[K],
  ) {
    setForm((current) => ({ ...current, [field]: value }));
    setValidationError("");
  }

  function handleAvatarFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file || !avatarLabels) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast.error(avatarLabels.invalidImageType);
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error(avatarLabels.imageTooLarge);
      event.target.value = "";
      return;
    }

    clearAvatarPreview();
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
    updateField("avatar", "");
    event.target.value = "";
  }

  async function resolveAvatarUrl() {
    const trimmedAvatar = form.avatar.trim();

    if (avatarFile && restaurantId) {
      const formData = new FormData();
      formData.append("restaurantId", restaurantId);
      formData.append("file", avatarFile);

      try {
        const result = await uploadCustomerAvatarAction(formData);
        return result.url;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "UPLOAD_FAILED";

        if (message === "INVALID_IMAGE_TYPE") {
          toast.error(avatarLabels?.invalidImageType);
        } else if (message === "IMAGE_TOO_LARGE") {
          toast.error(avatarLabels?.imageTooLarge);
        } else {
          toast.error(avatarLabels?.uploadError);
        }

        throw error;
      }
    }

    return trimmedAvatar;
  }

  async function handleAddCustomer() {
    const name = form.name.trim();

    if (!name) {
      setValidationError(labels.validation.draftCustomerName);
      return;
    }

    setIsSubmitting(true);

    try {
      const avatar = showAvatarField ? await resolveAvatarUrl() : "";

      await onAddCustomer({
        name,
        phone: form.phone.trim(),
        email: form.email.trim(),
        documentId: form.documentId.trim(),
        address: form.address.trim(),
        notes: form.notes.trim(),
        avatar,
      });
      resetForm();
      onOpenChange(false);
      toast.success(labels.customer.picker.addSuccess);
    } finally {
      setIsSubmitting(false);
    }
  }

  const previewName = form.name.trim() || labels.customer.namePlaceholder;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="flex max-h-[min(90vh,720px)] flex-col gap-0 overflow-hidden p-0 sm:max-w-lg">
        <DialogHeader className="border-b border-border px-6 py-5">
          <DialogTitle>{labels.customer.picker.title}</DialogTitle>
          <DialogDescription>{labels.customer.picker.description}</DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-5">
            {validationError ? (
              <div className="rounded-2xl bg-destructive/10 p-3 text-sm font-medium text-destructive">
                {validationError}
              </div>
            ) : null}

            {showAvatarField && avatarLabels ? (
              <div className="flex flex-col items-center gap-3">
                <div className="group/avatar relative size-20 cursor-pointer overflow-hidden rounded-full shadow-sm ring-2 ring-primary/20 transition-all duration-300 hover:ring-primary/45">
                  <Avatar className="size-full">
                    {avatarPreview || form.avatar.trim() ? (
                      <AvatarImage
                        src={avatarPreview || form.avatar.trim()}
                        alt={previewName}
                      />
                    ) : null}
                    <AvatarFallback className="flex size-full items-center justify-center bg-gradient-to-br from-primary/10 to-emerald-500/10 text-2xl font-bold text-primary">
                      {getCustomerInitials(previewName)}
                    </AvatarFallback>
                  </Avatar>
                  <label
                    htmlFor={avatarInputId}
                    className="absolute inset-0 flex cursor-pointer flex-col items-center justify-center bg-black/50 text-white opacity-0 transition-opacity duration-200 group-hover/avatar:opacity-100"
                  >
                    <span className="text-[10px] font-semibold uppercase tracking-wide">
                      {avatarLabels.changePhoto}
                    </span>
                  </label>
                  <input
                    id={avatarInputId}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarFileChange}
                    className="hidden"
                  />
                </div>
                <p className="text-[10px] font-medium text-muted-foreground/80">
                  {avatarLabels.photoHint}
                </p>
                <Field className="w-full">
                  <FieldLabel>{avatarLabels.photoUrl}</FieldLabel>
                  <Input
                    value={form.avatar}
                    onChange={(event) => {
                      clearAvatarPreview();
                      setAvatarFile(null);
                      setAvatarPreview(event.target.value);
                      updateField("avatar", event.target.value);
                    }}
                    placeholder={avatarLabels.photoUrlPlaceholder}
                    className="rounded-3xl"
                  />
                </Field>
              </div>
            ) : null}

            <Field>
              <FieldLabel className="required">{labels.customer.name}</FieldLabel>
              <Input
                value={form.name}
                onChange={(event) => updateField("name", event.target.value)}
                placeholder={labels.customer.namePlaceholder}
                className="rounded-3xl"
                autoFocus={!showAvatarField}
              />
            </Field>

            <Field>
              <FieldLabel>{labels.customer.documentId}</FieldLabel>
              <Input
                value={form.documentId}
                onChange={(event) => updateField("documentId", event.target.value)}
                placeholder={labels.customer.documentIdPlaceholder}
                className="rounded-3xl"
              />
            </Field>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field>
                <FieldLabel>{labels.customer.phone}</FieldLabel>
                <Input
                  type="tel"
                  value={form.phone}
                  onChange={(event) => updateField("phone", event.target.value)}
                  placeholder={labels.customer.phonePlaceholder}
                  className="rounded-3xl"
                />
              </Field>
              <Field>
                <FieldLabel>{labels.customer.email}</FieldLabel>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(event) => updateField("email", event.target.value)}
                  placeholder={labels.customer.emailPlaceholder}
                  className="rounded-3xl"
                />
              </Field>
            </div>

            <Field>
              <FieldLabel>{labels.customer.address}</FieldLabel>
              <Input
                value={form.address}
                onChange={(event) => updateField("address", event.target.value)}
                placeholder={labels.customer.addressPlaceholder}
                className="rounded-3xl"
              />
            </Field>

            <Field>
              <FieldLabel>{labels.customer.notes}</FieldLabel>
              <Textarea
                value={form.notes}
                onChange={(event) => updateField("notes", event.target.value)}
                placeholder={labels.customer.notesPlaceholder}
                className="min-h-24 rounded-3xl"
              />
            </Field>
          </div>
        </div>

        <DialogFooter className="border-t border-border px-6 py-4">
          <Button
            type="button"
            onClick={() => void handleAddCustomer()}
            disabled={isSubmitting}
          >
            <Plus className="mr-2 size-4" />
            {labels.customer.picker.addCustomer}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
