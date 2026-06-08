"use client";

import Link from "next/link";
import { Plus, X } from "lucide-react";
import { useMemo, useState } from "react";
import { FloorPlanTablePicker } from "@/components/dashboard/floor-plan/floor-plan-table-picker";
import type { CustomerOption } from "@/lib/customers/types";
import type { DiningSurfaceRecord, TableOccupancy } from "@/lib/floor-plan/types";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { NewCustomerDialog } from "./new-customer-dialog";
import type {
  NewOrderFormValues,
  NewOrderLabels,
  NewOrderNewCustomerInput,
  NewOrderSelectedCustomer,
} from "./types";
import { cn } from "@/lib/utils";

type NewOrderCustomerSectionProps = {
  labels: NewOrderLabels;
  customers: CustomerOption[];
  channel: NewOrderFormValues["channel"];
  floorPlanSurface: DiningSurfaceRecord | null;
  occupiedTableNumbers: TableOccupancy;
  values: Pick<NewOrderFormValues, "selectedCustomers" | "tableNumber">;
  errors: {
    customers?: string;
    tableNumber?: string;
  };
  onAddExistingCustomers: (customers: CustomerOption[]) => void;
  onAddNewCustomer: (customer: NewOrderNewCustomerInput) => void;
  onRemoveCustomer: (key: string) => void;
  onTableNumberChange: (value: string) => void;
};

export function NewOrderCustomerSection({
  labels,
  customers,
  channel,
  floorPlanSurface,
  occupiedTableNumbers,
  values,
  errors,
  onAddExistingCustomers,
  onAddNewCustomer,
  onRemoveCustomer,
  onTableNumberChange,
}: NewOrderCustomerSectionProps) {
  const [customerDialogOpen, setCustomerDialogOpen] = useState(false);
  const isDineIn = channel === "dineIn";
  const selectedExisting = useMemo(
    () =>
      values.selectedCustomers
        .filter((customer) => customer.source === "existing" && customer.id)
        .map((customer) => ({
          id: customer.id!,
          name: customer.name,
          phone: customer.phone || null,
          email: customer.email || null,
          documentId: customer.documentId || null,
        })),
    [values.selectedCustomers],
  );
  const tableNumbers = useMemo(() => {
    if (!floorPlanSurface) {
      return [];
    }

    return [...floorPlanSurface.tables]
      .map((table) => table.number)
      .sort((left, right) => {
        const leftNumber = Number.parseInt(left, 10);
        const rightNumber = Number.parseInt(right, 10);

        if (!Number.isNaN(leftNumber) && !Number.isNaN(rightNumber)) {
          return leftNumber - rightNumber;
        }

        return left.localeCompare(right, undefined, { numeric: true });
      });
  }, [floorPlanSurface]);

  return (
    <>
      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle>{labels.customer.title}</CardTitle>
            <CardDescription>{labels.customer.description}</CardDescription>
          </div>
          <Button
            type="button"
            className="gap-2"
            onClick={() => setCustomerDialogOpen(true)}
          >
            <Plus className="size-4" aria-hidden />
            {labels.actions.addCustomer}
          </Button>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            {isDineIn ? (
              <Field data-invalid={Boolean(errors.tableNumber)}>
                <FieldLabel htmlFor="table-number">
                  {labels.customer.tableNumber}
                </FieldLabel>
                {floorPlanSurface ? (
                  <>
                    <FloorPlanTablePicker
                      surface={floorPlanSurface}
                      occupiedTableNumbers={occupiedTableNumbers}
                      selectedTableNumber={values.tableNumber}
                      onSelectTable={onTableNumberChange}
                      labels={{
                        legendFree: labels.customer.tablePickerFree,
                        legendOccupied: labels.customer.tablePickerOccupied,
                        legendSelected: labels.customer.tablePickerSelected,
                        pickHint: labels.customer.tablePickerHint,
                      }}
                    />
                    <TableNumberSelect
                      id="table-number"
                      className="mt-3"
                      value={values.tableNumber}
                      tableNumbers={tableNumbers}
                      occupiedTableNumbers={occupiedTableNumbers}
                      placeholder={labels.customer.tableNumberPlaceholder}
                      occupiedLabel={labels.customer.tablePickerOccupied}
                      invalid={Boolean(errors.tableNumber)}
                      onChange={onTableNumberChange}
                    />
                  </>
                ) : (
                  <>
                    <TableNumberSelect
                      id="table-number"
                      value={values.tableNumber}
                      tableNumbers={tableNumbers}
                      occupiedTableNumbers={occupiedTableNumbers}
                      placeholder={labels.customer.tableNumberPlaceholder}
                      occupiedLabel={labels.customer.tablePickerOccupied}
                      invalid={Boolean(errors.tableNumber)}
                      disabled
                      onChange={onTableNumberChange}
                    />
                    <p className="text-sm text-muted-foreground">
                      {labels.customer.configureFloorPlan}{" "}
                      <Link href="/dashboard/floor-plan" className="underline">
                        /dashboard/floor-plan
                      </Link>
                    </p>
                  </>
                )}
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

      <NewCustomerDialog
        open={customerDialogOpen}
        onOpenChange={setCustomerDialogOpen}
        labels={labels}
        onAddCustomer={onAddNewCustomer}
      />
    </>
  );
}

function TableNumberSelect({
  id,
  value,
  tableNumbers,
  occupiedTableNumbers,
  placeholder,
  occupiedLabel,
  invalid = false,
  disabled = false,
  className,
  onChange,
}: {
  id: string;
  value: string;
  tableNumbers: string[];
  occupiedTableNumbers: TableOccupancy;
  placeholder: string;
  occupiedLabel: string;
  invalid?: boolean;
  disabled?: boolean;
  className?: string;
  onChange: (value: string) => void;
}) {
  const isDisabled = disabled || tableNumbers.length === 0;

  return (
    <Select
      value={value || undefined}
      onValueChange={onChange}
      disabled={isDisabled}
    >
      <SelectTrigger
        id={id}
        className={cn("w-full", className)}
        aria-invalid={invalid}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {tableNumbers.map((tableNumber) => {
          const isOccupied = occupiedTableNumbers[tableNumber] ?? false;

          return (
            <SelectItem
              key={tableNumber}
              value={tableNumber}
              disabled={isOccupied}
            >
              {tableNumber}
              {isOccupied ? ` · ${occupiedLabel}` : ""}
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
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
              <X className="size-4" aria-hidden />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

function formatCustomerSubtitle(customer: NewOrderSelectedCustomer) {
  return [customer.documentId, customer.phone, customer.email]
    .map((value) => value.trim())
    .filter(Boolean)
    .join(" · ");
}
