"use client";

import { Plus, X } from "lucide-react";
import { useMemo } from "react";
import type { CustomerOption } from "@/lib/customers/types";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type {
  NewOrderFormValues,
  NewOrderLabels,
  NewOrderSelectedCustomer,
} from "./types";

type NewOrderCustomerSectionProps = {
  labels: NewOrderLabels;
  customers: CustomerOption[];
  channel: NewOrderFormValues["channel"];
  values: Pick<
    NewOrderFormValues,
    "selectedCustomers" | "draftCustomerName" | "draftCustomerPhone" | "tableNumber"
  >;
  errors: {
    customers?: string;
    tableNumber?: string;
    draftCustomerName?: string;
  };
  onAddExistingCustomers: (customers: CustomerOption[]) => void;
  onRemoveCustomer: (key: string) => void;
  onDraftChange: (
    field: "draftCustomerName" | "draftCustomerPhone",
    value: string,
  ) => void;
  onAddDraftCustomer: () => void;
  onTableNumberChange: (value: string) => void;
};

export function NewOrderCustomerSection({
  labels,
  customers,
  channel,
  values,
  errors,
  onAddExistingCustomers,
  onRemoveCustomer,
  onDraftChange,
  onAddDraftCustomer,
  onTableNumberChange,
}: NewOrderCustomerSectionProps) {
  const isDineIn = channel === "dineIn";
  const selectedExisting = useMemo(
    () =>
      values.selectedCustomers
        .filter((customer) => customer.source === "existing" && customer.id)
        .map((customer) => ({
          id: customer.id!,
          name: customer.name,
          phone: customer.phone || null,
          email: null,
        })),
    [values.selectedCustomers],
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>{labels.customer.title}</CardTitle>
        <CardDescription>{labels.customer.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <FieldGroup>
          {isDineIn ? (
            <Field data-invalid={Boolean(errors.tableNumber)}>
              <FieldLabel htmlFor="table-number">
                {labels.customer.tableNumber}
              </FieldLabel>
              <Input
                id="table-number"
                value={values.tableNumber}
                onChange={(event) => onTableNumberChange(event.target.value)}
                placeholder={labels.customer.tableNumberPlaceholder}
                aria-invalid={Boolean(errors.tableNumber)}
              />
              {errors.tableNumber ? (
                <p className="text-sm text-destructive">{errors.tableNumber}</p>
              ) : null}
            </Field>
          ) : null}

          {customers.length > 0 ? (
            <ExistingCustomerPicker
              labels={labels}
              customers={customers}
              selectedExisting={selectedExisting}
              onAddExistingCustomers={onAddExistingCustomers}
            />
          ) : null}

          <div className="rounded-3xl border border-border bg-muted/20 p-4">
            <p className="text-sm text-muted-foreground">{labels.customer.newHint}</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-end">
              <Field data-invalid={Boolean(errors.draftCustomerName)}>
                <FieldLabel htmlFor="draft-customer-name">
                  {labels.customer.name}
                </FieldLabel>
                <Input
                  id="draft-customer-name"
                  value={values.draftCustomerName}
                  onChange={(event) =>
                    onDraftChange("draftCustomerName", event.target.value)
                  }
                  placeholder={labels.customer.namePlaceholder}
                  aria-invalid={Boolean(errors.draftCustomerName)}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="draft-customer-phone">
                  {labels.customer.phone}
                </FieldLabel>
                <Input
                  id="draft-customer-phone"
                  type="tel"
                  value={values.draftCustomerPhone}
                  onChange={(event) =>
                    onDraftChange("draftCustomerPhone", event.target.value)
                  }
                  placeholder={labels.customer.phonePlaceholder}
                />
              </Field>
              <Button
                type="button"
                variant="secondary"
                className="gap-2"
                onClick={onAddDraftCustomer}
              >
                <Plus className="size-4" aria-hidden />
                {labels.actions.addCustomer}
              </Button>
            </div>
            {errors.draftCustomerName ? (
              <p className="mt-2 text-sm text-destructive">
                {errors.draftCustomerName}
              </p>
            ) : null}
          </div>

          {errors.customers ? (
            <p className="text-sm text-destructive">{errors.customers}</p>
          ) : null}

          {values.selectedCustomers.length > 0 ? (
            <SelectedCustomersList
              labels={labels}
              customers={values.selectedCustomers}
              onRemove={onRemoveCustomer}
            />
          ) : (
            <p className="text-sm text-muted-foreground">
              {labels.customer.emptySelection}
            </p>
          )}
        </FieldGroup>
      </CardContent>
    </Card>
  );
}

function ExistingCustomerPicker({
  labels,
  customers,
  selectedExisting,
  onAddExistingCustomers,
}: {
  labels: NewOrderLabels;
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
        <ComboboxChips ref={anchorRef} className="w-full">
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
                  {customer.phone ? (
                    <span className="truncate text-xs text-muted-foreground">
                      {customer.phone}
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
  labels: NewOrderLabels;
  customers: NewOrderSelectedCustomer[];
  onRemove: (key: string) => void;
}) {
  return (
    <div className="space-y-2">
      <FieldLabel>{labels.customer.title}</FieldLabel>
      <div className="flex flex-wrap gap-2">
        {customers.map((customer) => (
          <div
            key={customer.key}
            className="flex items-center gap-2 rounded-3xl border border-border bg-card px-3 py-2 text-sm"
          >
            <div className="min-w-0">
              <p className="font-medium">{customer.name}</p>
              {customer.phone ? (
                <p className="text-xs text-muted-foreground">{customer.phone}</p>
              ) : null}
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              onClick={() => onRemove(customer.key)}
              aria-label={labels.actions.removeCustomer}
            >
              <X className="size-4" aria-hidden />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
