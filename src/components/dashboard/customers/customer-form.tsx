"use client";

import { useId } from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { CustomerFormDialogLabels } from "@/lib/customers/customer-form-labels";
import type { CustomerFormValues } from "@/lib/customers/customer-form-values";
import { getCustomerInitials } from "@/lib/customers/format";
import type { CustomerTagSummary } from "@/lib/customers/tags.types";
import {
  CustomerTagsMultiSelect,
  type CustomerTagsMultiSelectLabels,
} from "./customer-tags-multi-select";

export type CustomerFormLabels = CustomerFormDialogLabels & {
  tags: CustomerTagsMultiSelectLabels;
};

export type CustomerFormAvatarState = {
  avatarFile: File | null;
  avatarPreview: string;
  setAvatarFile: (file: File | null) => void;
  setAvatarPreview: (preview: string) => void;
  clearAvatarPreview: () => void;
};

type CustomerFormProps = {
  labels: CustomerFormLabels;
  tags: CustomerTagSummary[];
  value: CustomerFormValues;
  onChange: (value: CustomerFormValues) => void;
  onCreateTag: (input: {
    name: string;
    color: string;
  }) => Promise<CustomerTagSummary>;
  isCreatingTag?: boolean;
  validationError?: string;
  showAvatarField?: boolean;
  showTags?: boolean;
  avatarState?: CustomerFormAvatarState;
};

function FormFieldLabel({
  children,
  required,
  optionalLabel,
  requiredLabel,
}: {
  children: React.ReactNode;
  required: boolean;
  optionalLabel: string;
  requiredLabel: string;
}) {
  return (
    <FieldLabel className={required ? "required" : undefined}>
      {children}
      <span className="text-xs font-normal text-muted-foreground">
        {" "}
        ({required ? requiredLabel : optionalLabel})
      </span>
    </FieldLabel>
  );
}

export function CustomerForm({
  labels,
  tags,
  value,
  onChange,
  onCreateTag,
  isCreatingTag = false,
  validationError,
  showAvatarField = false,
  showTags = true,
  avatarState,
}: CustomerFormProps) {
  const avatarInputId = useId();
  const avatarLabels = labels.avatar;

  function updateField<K extends keyof CustomerFormValues>(
    field: K,
    fieldValue: CustomerFormValues[K],
  ) {
    onChange({ ...value, [field]: fieldValue });
  }

  function handleAvatarFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file || !avatarLabels || !avatarState) {
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

    avatarState.clearAvatarPreview();
    avatarState.setAvatarFile(file);
    avatarState.setAvatarPreview(URL.createObjectURL(file));
    updateField("avatar", "");
    event.target.value = "";
  }

  const previewName = value.name.trim() || labels.customer.namePlaceholder;
  const avatarPreview = avatarState?.avatarPreview ?? "";

  return (
    <div className="space-y-5">
      {validationError ? (
        <div className="rounded-2xl bg-destructive/10 p-3 text-sm font-medium text-destructive">
          {validationError}
        </div>
      ) : null}

      {showAvatarField && avatarLabels && avatarState ? (
        <div className="flex flex-col items-center gap-3">
          <div className="group/avatar relative size-20 cursor-pointer overflow-hidden rounded-full shadow-sm ring-2 ring-primary/20 transition-all duration-300 hover:ring-primary/45">
            <Avatar className="size-full">
              {avatarPreview || value.avatar.trim() ? (
                <AvatarImage
                  src={avatarPreview || value.avatar.trim()}
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
            <FormFieldLabel
              required={false}
              optionalLabel={labels.optional}
              requiredLabel={labels.required}
            >
              {avatarLabels.photoUrl}
            </FormFieldLabel>
            <Input
              value={value.avatar}
              onChange={(event) => {
                avatarState.clearAvatarPreview();
                avatarState.setAvatarFile(null);
                avatarState.setAvatarPreview(event.target.value);
                updateField("avatar", event.target.value);
              }}
              placeholder={avatarLabels.photoUrlPlaceholder}
              className="rounded-3xl"
            />
          </Field>
        </div>
      ) : null}

      <Field>
        <FormFieldLabel
          required
          optionalLabel={labels.optional}
          requiredLabel={labels.required}
        >
          {labels.customer.name}
        </FormFieldLabel>
        <Input
          value={value.name}
          onChange={(event) => updateField("name", event.target.value)}
          placeholder={labels.customer.namePlaceholder}
          className="rounded-3xl"
          autoFocus={!showAvatarField}
        />
      </Field>

      <Field>
        <FormFieldLabel
          required={false}
          optionalLabel={labels.optional}
          requiredLabel={labels.required}
        >
          {labels.customer.documentId}
        </FormFieldLabel>
        <Input
          value={value.documentId}
          onChange={(event) => updateField("documentId", event.target.value)}
          placeholder={labels.customer.documentIdPlaceholder}
          className="rounded-3xl"
        />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field>
          <FormFieldLabel
            required={false}
            optionalLabel={labels.optional}
            requiredLabel={labels.required}
          >
            {labels.customer.phone}
          </FormFieldLabel>
          <Input
            type="tel"
            value={value.phone}
            onChange={(event) => updateField("phone", event.target.value)}
            placeholder={labels.customer.phonePlaceholder}
            className="rounded-3xl"
          />
        </Field>
        <Field>
          <FormFieldLabel
            required={false}
            optionalLabel={labels.optional}
            requiredLabel={labels.required}
          >
            {labels.customer.email}
          </FormFieldLabel>
          <Input
            type="email"
            value={value.email}
            onChange={(event) => updateField("email", event.target.value)}
            placeholder={labels.customer.emailPlaceholder}
            className="rounded-3xl"
          />
        </Field>
      </div>

      <Field>
        <FormFieldLabel
          required={false}
          optionalLabel={labels.optional}
          requiredLabel={labels.required}
        >
          {labels.customer.address}
        </FormFieldLabel>
        <Input
          value={value.address}
          onChange={(event) => updateField("address", event.target.value)}
          placeholder={labels.customer.addressPlaceholder}
          className="rounded-3xl"
        />
      </Field>

      {showTags ? (
        <CustomerTagsMultiSelect
          labels={{
            ...labels.tags,
            optionalLabel: labels.optional,
          }}
          tags={tags}
          value={value.tagIds}
          onChange={(tagIds) => updateField("tagIds", tagIds)}
          onCreateTag={onCreateTag}
          isCreatingTag={isCreatingTag}
        />
      ) : null}

      <Field>
        <FormFieldLabel
          required={false}
          optionalLabel={labels.optional}
          requiredLabel={labels.required}
        >
          {labels.customer.notes}
        </FormFieldLabel>
        <Textarea
          value={value.notes}
          onChange={(event) => updateField("notes", event.target.value)}
          placeholder={labels.customer.notesPlaceholder}
          className="min-h-24 rounded-3xl"
        />
      </Field>
    </div>
  );
}
