"use client";

import { TbPlus, TbDeviceFloppy } from "react-icons/tb";
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
import {
  customerDetailToFormValues,
  emptyCustomerFormValues,
  type CustomerFormValues,
} from "@/lib/customers/customer-form-values";
import type { CustomerDetail } from "@/lib/customers/types";
import { useCreateCustomerTagMutation } from "@/lib/query/customers/customer-tags.mutations";
import { useCustomerTagsQuery } from "@/lib/query/customers/customer-tags.queries";
import {
  CustomerForm,
  type CustomerFormLabels,
} from "./customer-form";
import { useCustomerFormAvatar } from "./use-customer-form-avatar";

export type CustomerDialogMode = "create" | "edit";

export type CustomerDialogSubmitInput = CustomerFormValues & {
  avatar: string;
};

type CustomerDialogProps = {
  mode: CustomerDialogMode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  labels: CustomerFormLabels & {
    createTitle: string;
    createDescription: string;
    createButton: string;
    editTitle: string;
    editDescription: string;
    editButton: string;
    createSuccess: string;
    editSuccess: string;
  };
  restaurantId: string;
  organizationId: string;
  customer?: CustomerDetail | null;
  editCustomerId?: string | null;
  isSubmitting?: boolean;
  onSubmit: (input: CustomerDialogSubmitInput) => void | Promise<void>;
};

type CustomerDialogBodyProps = Omit<
  CustomerDialogProps,
  "open" | "onOpenChange"
> & {
  onClose: () => void;
};

function CustomerDialogBody({
  mode,
  labels,
  restaurantId,
  organizationId,
  customer = null,
  isSubmitting = false,
  onSubmit,
  onClose,
}: CustomerDialogBodyProps) {
  const [form, setForm] = useState<CustomerFormValues>(() =>
    mode === "edit" && customer
      ? customerDetailToFormValues(customer)
      : emptyCustomerFormValues,
  );
  const [validationError, setValidationError] = useState("");
  const { avatarState, resetAvatar, resolveAvatarUrl } = useCustomerFormAvatar();
  const tagsQuery = useCustomerTagsQuery(organizationId);
  const createTagMutation = useCreateCustomerTagMutation(organizationId);

  async function handleSubmit() {
    const name = form.name.trim();

    if (!name) {
      setValidationError(labels.validation.draftCustomerName);
      return;
    }

    try {
      const avatar = labels.avatar
        ? await resolveAvatarUrl(restaurantId, form.avatar, labels.avatar)
        : form.avatar.trim();

      await onSubmit({
        ...form,
        name,
        avatar,
      });

      if (mode === "create") {
        toast.success(labels.createSuccess);
      } else {
        toast.success(labels.editSuccess);
      }

      resetAvatar();
      onClose();
    } catch {
      // Parent or avatar upload already surfaced the error.
    }
  }

  const submitLabel =
    mode === "create" ? labels.createButton : labels.editButton;
  const SubmitIcon = mode === "create" ? TbPlus : TbDeviceFloppy;

  return (
    <>
      <div className="flex-1 overflow-y-auto p-6">
        <CustomerForm
          labels={labels}
          tags={tagsQuery.data ?? []}
          value={form}
          onChange={(nextValue) => {
            setForm(nextValue);
            setValidationError("");
          }}
          onCreateTag={(input) => createTagMutation.mutateAsync(input)}
          isCreatingTag={createTagMutation.isPending}
          validationError={validationError}
          showAvatarField={Boolean(labels.avatar && restaurantId)}
          avatarState={avatarState}
        />
      </div>

      <DialogFooter className="border-t border-border px-6 py-4">
        <Button
          type="button"
          onClick={() => void handleSubmit()}
          disabled={isSubmitting || createTagMutation.isPending}
        >
          <SubmitIcon className="mr-2 size-4" aria-hidden />
          {submitLabel}
        </Button>
      </DialogFooter>
    </>
  );
}

export function CustomerDialog({
  mode,
  open,
  onOpenChange,
  labels,
  restaurantId,
  organizationId,
  customer = null,
  editCustomerId = null,
  isSubmitting = false,
  onSubmit,
}: CustomerDialogProps) {
  const title = mode === "create" ? labels.createTitle : labels.editTitle;
  const description =
    mode === "create" ? labels.createDescription : labels.editDescription;
  const dialogKey =
    mode === "edit"
      ? `edit-${customer?.id ?? editCustomerId ?? "pending"}`
      : "create";
  const canRenderBody = mode === "create" || Boolean(customer);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(90vh,720px)] flex-col gap-0 overflow-hidden p-0 sm:max-w-lg">
        <DialogHeader className="border-b border-border px-6 py-5">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {open && canRenderBody ? (
          <CustomerDialogBody
            key={dialogKey}
            mode={mode}
            labels={labels}
            restaurantId={restaurantId}
            organizationId={organizationId}
            customer={customer}
            isSubmitting={isSubmitting}
            onSubmit={onSubmit}
            onClose={() => onOpenChange(false)}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
