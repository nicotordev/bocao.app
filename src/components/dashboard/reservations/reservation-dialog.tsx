"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CustomerOption } from "@/lib/customers/types";
import type { Reservation, ReservationStatus } from "@/lib/reservations/types";
import type { ReservationsPageLabels } from "@/lib/reservations/page-labels";
import { ReservationCustomerSection } from "./reservation-customer-section";
import type {
  ReservationFormSubmitData,
  ReservationNewCustomerInput,
  ReservationSelectedCustomer,
} from "./reservation-dialog.types";

type ReservationDialogProps = {
  labels: ReservationsPageLabels;
  customers: CustomerOption[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClose: () => void;
  reservation: Reservation | null;
  onSubmit: (data: ReservationFormSubmitData) => void;
  isSubmitting: boolean;
};

function createCustomerKey() {
  return crypto.randomUUID();
}

function formatForInput(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate(),
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function buildInitialCustomers(
  reservation: Reservation | null,
  customers: CustomerOption[],
): ReservationSelectedCustomer[] {
  if (!reservation) {
    return [];
  }

  const linkedCustomer = reservation.customerId
    ? customers.find((customer) => customer.id === reservation.customerId)
    : null;

  if (linkedCustomer) {
    return [
      {
        key: linkedCustomer.id,
        id: linkedCustomer.id,
        name: linkedCustomer.name,
        phone: linkedCustomer.phone ?? "",
        email: linkedCustomer.email ?? "",
        documentId: linkedCustomer.documentId ?? "",
        address: "",
        notes: "",
        source: "existing",
      },
    ];
  }

  if (reservation.guestName.trim()) {
    return [
      {
        key: createCustomerKey(),
        name: reservation.guestName,
        phone: reservation.guestPhone ?? "",
        email: "",
        documentId: "",
        address: "",
        notes: "",
        source: "new",
      },
    ];
  }

  return [];
}

function reservationFormKey(
  reservation: Reservation | null,
  customers: CustomerOption[],
) {
  const customerLookupKey = reservation?.customerId
    ? (customers.find((customer) => customer.id === reservation.customerId)
        ?.id ?? "pending")
    : "none";

  return `${reservation?.id ?? "new"}-${customerLookupKey}`;
}

export function ReservationDialog({
  labels,
  customers,
  open,
  onOpenChange,
  onClose,
  reservation,
  onSubmit,
  isSubmitting,
}: ReservationDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[min(90vh,720px)] max-w-md overflow-y-auto rounded-3xl">
        <DialogHeader>
          <DialogTitle>
            {reservation ? labels.form.submitEdit : labels.form.submitCreate}
          </DialogTitle>
          <DialogDescription>
            {reservation
              ? labels.form.editDescription
              : labels.form.createDescription}
          </DialogDescription>
        </DialogHeader>

        {open ? (
          <ReservationFormFields
            key={reservationFormKey(reservation, customers)}
            labels={labels}
            customers={customers}
            reservation={reservation}
            onClose={onClose}
            onSubmit={onSubmit}
            isSubmitting={isSubmitting}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function ReservationFormFields({
  labels,
  customers,
  reservation,
  onClose,
  onSubmit,
  isSubmitting,
}: {
  labels: ReservationsPageLabels;
  customers: CustomerOption[];
  reservation: Reservation | null;
  onClose: () => void;
  onSubmit: (data: ReservationFormSubmitData) => void;
  isSubmitting: boolean;
}) {
  const [selectedCustomers, setSelectedCustomers] = useState(() =>
    buildInitialCustomers(reservation, customers),
  );
  const [guestCount, setGuestCount] = useState(
    () => reservation?.guestCount ?? 2,
  );
  const [status, setStatus] = useState<ReservationStatus>(
    () => reservation?.status ?? "CONFIRMED",
  );
  const [scheduledAt, setScheduledAt] = useState(() =>
    reservation
      ? formatForInput(new Date(reservation.scheduledAt))
      : formatForInput(new Date()),
  );
  const [notes, setNotes] = useState(() => reservation?.notes || "");
  const [customerError, setCustomerError] = useState("");

  function syncExistingCustomers(nextExisting: CustomerOption[]) {
    setSelectedCustomers((current) => {
      const preservedNewCustomers = current.filter(
        (customer) => customer.source === "new",
      );
      const nextExistingCustomers: ReservationSelectedCustomer[] =
        nextExisting.map((customer) => ({
          key: customer.id,
          id: customer.id,
          name: customer.name,
          phone: customer.phone ?? "",
          email: customer.email ?? "",
          documentId: customer.documentId ?? "",
          address: "",
          notes: "",
          source: "existing",
        }));

      return [...nextExistingCustomers, ...preservedNewCustomers];
    });
    setCustomerError("");
  }

  function addNewCustomer(customer: ReservationNewCustomerInput) {
    setSelectedCustomers((current) => [
      ...current,
      {
        key: createCustomerKey(),
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        documentId: customer.documentId,
        address: customer.address,
        notes: customer.notes,
        source: "new",
      },
    ]);
    setCustomerError("");
  }

  function removeCustomer(key: string) {
    setSelectedCustomers((current) =>
      current.filter((customer) => customer.key !== key),
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedCustomers.length === 0) {
      setCustomerError(labels.validation.customers);
      return;
    }

    if (!scheduledAt) {
      return;
    }

    onSubmit({
      customers: selectedCustomers.map((customer) => ({
        id: customer.id,
        name: customer.name.trim(),
        phone: customer.phone.trim() || undefined,
        email: customer.email.trim() || undefined,
        documentId: customer.documentId.trim() || undefined,
        address: customer.address.trim() || undefined,
        notes: customer.notes.trim() || undefined,
      })),
      guestCount,
      status,
      scheduledAt: new Date(scheduledAt).toISOString(),
      notes: notes.trim() || undefined,
    });
  };

  const customerLabels = {
    optional: labels.optional,
    required: labels.required,
    customer: labels.form.customer,
    validation: labels.validation,
    actions: labels.actions,
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 py-2">
      <ReservationCustomerSection
        labels={customerLabels}
        customers={customers}
        selectedCustomers={selectedCustomers}
        error={customerError}
        onAddExistingCustomers={syncExistingCustomers}
        onAddNewCustomer={addNewCustomer}
        onRemoveCustomer={removeCustomer}
      />

      <div className="space-y-2">
        <Label htmlFor="guestCount">{labels.form.guestCount}</Label>
        <Input
          id="guestCount"
          type="number"
          min={1}
          max={100}
          value={guestCount}
          onChange={(e) => setGuestCount(parseInt(e.target.value) || 1)}
          required
          className="rounded-2xl"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="scheduledAt">{labels.form.scheduledAt}</Label>
          <Input
            id="scheduledAt"
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            required
            className="rounded-2xl"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="status">{labels.form.status}</Label>
          <Select
            value={status}
            onValueChange={(val) => setStatus(val as ReservationStatus)}
          >
            <SelectTrigger id="status" className="rounded-2xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              {(
                [
                  "PENDING",
                  "CONFIRMED",
                  "SEATED",
                  "COMPLETED",
                  "CANCELLED",
                  "NO_SHOW",
                ] as ReservationStatus[]
              ).map((s) => (
                <SelectItem key={s} value={s} className="rounded-lg">
                  {labels.statuses[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">{labels.form.notes}</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="min-h-[80px] rounded-2xl"
        />
      </div>

      <DialogFooter className="flex gap-2 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          className="flex-1 rounded-2xl sm:flex-initial"
          disabled={isSubmitting}
        >
          {labels.form.cancel}
        </Button>
        <Button
          type="submit"
          className="flex-1 rounded-2xl sm:flex-initial"
          disabled={isSubmitting}
        >
          {isSubmitting
            ? labels.form.saving
            : reservation
              ? labels.form.save
              : labels.form.create}
        </Button>
      </DialogFooter>
    </form>
  );
}
