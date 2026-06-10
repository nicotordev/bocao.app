"use client";

import {
  TbPlus,
  TbX,
} from "react-icons/tb";
import { useMemo, useState } from "react";
import { NewCustomerDialog } from "@/components/dashboard/orders/new/new-customer-dialog";
import type { CustomerFormDialogLabels } from "@/lib/customers/customer-form-labels";
import type { CustomerOption } from "@/lib/customers/types";
import { Button } from "@/components/ui/button";
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  useComboboxAnchor,
} from "@/components/ui/combobox";
import type {
  ReservationNewCustomerInput,
  ReservationSelectedCustomer,
} from "./reservation-dialog.types";

type ReservationCustomerSectionProps = {
  labels: CustomerFormDialogLabels & {
    customer: CustomerFormDialogLabels["customer"] & {
      title: string;
      description: string;
    };
  };
  customers: CustomerOption[];
  selectedCustomers: ReservationSelectedCustomer[];
  error?: string;
  onAddExistingCustomers: (customers: CustomerOption[]) => void;
  onAddNewCustomer: (customer: ReservationNewCustomerInput) => void;
  onRemoveCustomer: (key: string) => void;
};

export function ReservationCustomerSection({
  labels,
  customers,
  selectedCustomers,
  error,
  onAddExistingCustomers,
  onAddNewCustomer,
  onRemoveCustomer,
}: ReservationCustomerSectionProps) {
  const [customerDialogOpen, setCustomerDialogOpen] = useState(false);

  const selectedExisting = useMemo(
    () =>
      selectedCustomers
        .filter((customer) => customer.source === "existing" && customer.id)
        .map((customer) => ({
          id: customer.id!,
          name: customer.name,
          phone: customer.phone || null,
          email: customer.email || null,
          documentId: customer.documentId || null,
        })),
    [selectedCustomers],
  );

  return (
    <>
      <div className="space-y-3 rounded-2xl border border-border p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="font-medium">{labels.customer.title}</p>
            <p className="text-sm text-muted-foreground">
              {labels.customer.description}
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-2 rounded-2xl"
            onClick={() => setCustomerDialogOpen(true)}
          >
            <TbPlus className="size-4" aria-hidden />
            {labels.actions.addCustomer}
          </Button>
        </div>

        {customers.length > 0 ? (
          <ExistingCustomerPicker
            labels={labels}
            customers={customers}
            selectedExisting={selectedExisting}
            onAddExistingCustomers={onAddExistingCustomers}
          />
        ) : null}

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        {selectedCustomers.length > 0 ? (
          <SelectedCustomersList
            labels={labels}
            customers={selectedCustomers}
            onRemove={onRemoveCustomer}
          />
        ) : (
          <p className="text-sm text-muted-foreground">
            {labels.customer.emptySelection}
          </p>
        )}
      </div>

      <NewCustomerDialog
        open={customerDialogOpen}
        onOpenChange={setCustomerDialogOpen}
        labels={labels}
        onAddCustomer={onAddNewCustomer}
      />
    </>
  );
}

function ExistingCustomerPicker({
  labels,
  customers,
  selectedExisting,
  onAddExistingCustomers,
}: {
  labels: CustomerFormDialogLabels;
  customers: CustomerOption[];
  selectedExisting: CustomerOption[];
  onAddExistingCustomers: (customers: CustomerOption[]) => void;
}) {
  const anchorRef = useComboboxAnchor();

  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground">{labels.customer.selectedHint}</p>
      <Combobox
        multiple
        items={customers}
        value={selectedExisting}
        onValueChange={(nextValue) => {
          onAddExistingCustomers(nextValue ?? []);
        }}
        itemToStringLabel={(customer) => customer.name}
        isItemEqualToValue={(item, value) => item.id === value.id}
      >
        <ComboboxChips ref={anchorRef} className="w-full rounded-2xl">
          {selectedExisting.map((customer) => (
            <ComboboxChip key={customer.id} aria-label={customer.name}>
              {customer.name}
            </ComboboxChip>
          ))}
          <ComboboxChipsInput placeholder={labels.customer.searchPlaceholder} />
        </ComboboxChips>
        <ComboboxContent anchor={anchorRef}>
          <ComboboxEmpty>{labels.customer.noResults}</ComboboxEmpty>
          <ComboboxList>
            {(customer) => (
              <ComboboxItem key={customer.id} value={customer}>
                <span className="flex min-w-0 flex-col">
                  <span className="truncate font-medium">{customer.name}</span>
                  {customer.phone || customer.documentId ? (
                    <span className="truncate text-xs text-muted-foreground">
                      {[customer.documentId, customer.phone]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  ) : null}
                </span>
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </div>
  );
}

function SelectedCustomersList({
  labels,
  customers,
  onRemove,
}: {
  labels: ReservationCustomerSectionProps["labels"];
  customers: ReservationSelectedCustomer[];
  onRemove: (key: string) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {customers.map((customer) => (
          <div
            key={customer.key}
            className="flex items-center gap-2 rounded-3xl border border-border bg-card px-3 py-2 text-sm"
          >
            <div className="min-w-0">
              <p className="font-medium">{customer.name}</p>
              {formatCustomerSubtitle(customer) ? (
                <p className="text-xs text-muted-foreground">
                  {formatCustomerSubtitle(customer)}
                </p>
              ) : null}
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              onClick={() => onRemove(customer.key)}
              aria-label={labels.actions.removeCustomer}
            >
              <TbX className="size-4" aria-hidden />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

function formatCustomerSubtitle(customer: ReservationSelectedCustomer) {
  return [customer.documentId, customer.phone, customer.email]
    .map((value) => value.trim())
    .filter(Boolean)
    .join(" · ");
}
