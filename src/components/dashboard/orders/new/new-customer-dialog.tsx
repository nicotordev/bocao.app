"use client";

import { Plus } from "lucide-react";
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
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { NewOrderLabels, NewOrderNewCustomerInput } from "./types";

type NewCustomerDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  labels: NewOrderLabels;
  onAddCustomer: (customer: NewOrderNewCustomerInput) => void;
};

const emptyForm: NewOrderNewCustomerInput = {
  name: "",
  phone: "",
  email: "",
  documentId: "",
  address: "",
  notes: "",
};

export function NewCustomerDialog({
  open,
  onOpenChange,
  labels,
  onAddCustomer,
}: NewCustomerDialogProps) {
  const [form, setForm] = useState<NewOrderNewCustomerInput>(emptyForm);
  const [validationError, setValidationError] = useState("");

  function resetForm() {
    setForm(emptyForm);
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

  function handleAddCustomer() {
    const name = form.name.trim();

    if (!name) {
      setValidationError(labels.validation.draftCustomerName);
      return;
    }

    onAddCustomer({
      name,
      phone: form.phone.trim(),
      email: form.email.trim(),
      documentId: form.documentId.trim(),
      address: form.address.trim(),
      notes: form.notes.trim(),
    });
    resetForm();
    onOpenChange(false);
    toast.success(labels.customer.picker.addSuccess);
  }

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

            <Field>
              <FieldLabel className="required">{labels.customer.name}</FieldLabel>
              <Input
                value={form.name}
                onChange={(event) => updateField("name", event.target.value)}
                placeholder={labels.customer.namePlaceholder}
                className="rounded-3xl"
                autoFocus
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
          <Button type="button" onClick={handleAddCustomer}>
            <Plus className="mr-2 size-4" />
            {labels.customer.picker.addCustomer}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
