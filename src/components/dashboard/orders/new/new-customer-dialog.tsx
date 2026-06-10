"use client";

import { TbPlus } from "react-icons/tb";
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
  CustomerForm,
  type CustomerFormLabels,
} from "@/components/dashboard/customers/customer-form";
import { useCustomerFormAvatar } from "@/components/dashboard/customers/use-customer-form-avatar";
import {
  emptyCustomerFormValues,
  type CustomerFormValues,
} from "@/lib/customers/customer-form-values";
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

export function NewCustomerDialog({
  open,
  onOpenChange,
  labels,
  restaurantId,
  onAddCustomer,
}: NewCustomerDialogProps) {
  const [form, setForm] = useState<CustomerFormValues>(emptyCustomerFormValues);
  const [validationError, setValidationError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { avatarState, resetAvatar, resolveAvatarUrl } = useCustomerFormAvatar();
  const showAvatarField = Boolean(labels.avatar && restaurantId);

  const formLabels: CustomerFormLabels = {
    ...labels,
    tags: {
      label: "",
      searchPlaceholder: "",
      noResults: "",
      createTag: "",
      createTagDialog: {
        title: "",
        name: "",
        namePlaceholder: "",
        color: "",
        create: "",
        cancel: "",
        nameRequired: "",
      },
    },
  };

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      setForm(emptyCustomerFormValues);
      resetAvatar();
      setValidationError("");
    }

    onOpenChange(nextOpen);
  }

  async function handleAddCustomer() {
    const name = form.name.trim();

    if (!name) {
      setValidationError(labels.validation.draftCustomerName);
      return;
    }

    setIsSubmitting(true);

    try {
      const avatar = showAvatarField
        ? await resolveAvatarUrl(
            restaurantId!,
            form.avatar,
            labels.avatar,
          )
        : "";

      await onAddCustomer({
        name,
        phone: form.phone.trim(),
        email: form.email.trim(),
        documentId: form.documentId.trim(),
        address: form.address.trim(),
        notes: form.notes.trim(),
        avatar,
      });
      handleOpenChange(false);
      toast.success(labels.customer.picker.addSuccess);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="flex max-h-[min(90vh,720px)] flex-col gap-0 overflow-hidden p-0 sm:max-w-lg">
        <DialogHeader className="border-b border-border px-6 py-5">
          <DialogTitle>{labels.customer.picker.title}</DialogTitle>
          <DialogDescription>{labels.customer.picker.description}</DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6">
          <CustomerForm
            labels={formLabels}
            tags={[]}
            value={form}
            onChange={(nextValue) => {
              setForm(nextValue);
              setValidationError("");
            }}
            onCreateTag={async () => {
              throw new Error("Tags are not available in this context");
            }}
            validationError={validationError}
            showAvatarField={showAvatarField}
            showTags={false}
            avatarState={avatarState}
          />
        </div>

        <DialogFooter className="border-t border-border px-6 py-4">
          <Button
            type="button"
            onClick={() => void handleAddCustomer()}
            disabled={isSubmitting}
          >
            <TbPlus className="mr-2 size-4" />
            {labels.customer.picker.addCustomer}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
