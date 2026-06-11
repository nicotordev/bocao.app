"use client";

import Link from "next/link";
import { TbArrowsMaximize, TbPlus, TbX } from "react-icons/tb";
import { useMemo, useState } from "react";
import { FloorPlanFloorSwitcher } from "@/components/dashboard/floor-plan/floor-plan-floor-switcher";
import { FloorPlanTablePicker } from "@/components/dashboard/floor-plan/floor-plan-table-picker";
import { FloorPlanTablePickerDialog } from "@/components/dashboard/floor-plan/floor-plan-table-picker-dialog";
import type { CustomerOption } from "@/lib/customers/types";
import type {
  DiningSurfaceRecord,
  TableOccupancy,
} from "@/lib/floor-plan/types";
import { useFloorPlanSurfaceSelection } from "@/hooks/use-floor-plan-surface-selection";
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
  kind: NewOrderFormValues["kind"];
  floorPlanSurfaces: DiningSurfaceRecord[];
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
  kind,
  floorPlanSurfaces,
  occupiedTableNumbers,
  values,
  errors,
  onAddExistingCustomers,
  onAddNewCustomer,
  onRemoveCustomer,
  onTableNumberChange,
}: NewOrderCustomerSectionProps) {
  const [customerDialogOpen, setCustomerDialogOpen] = useState(false);
  const [pickerDialogOpen, setPickerDialogOpen] = useState(false);
  const isDineIn = kind === "dineIn" || kind === "pos";
  const hasFloorPlan = floorPlanSurfaces.length > 0;
  const selection = useFloorPlanSurfaceSelection(
    floorPlanSurfaces,
    values.tableNumber,
  );
  const activeSurface = selection.activeSurface;

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
    if (!activeSurface) {
      return [];
    }

    return [...activeSurface.tables]
      .map((table) => table.number)
      .sort((left, right) => {
        const leftNumber = Number.parseInt(left, 10);
        const rightNumber = Number.parseInt(right, 10);

        if (!Number.isNaN(leftNumber) && !Number.isNaN(rightNumber)) {
          return leftNumber - rightNumber;
        }

        return left.localeCompare(right, undefined, { numeric: true });
      });
  }, [activeSurface]);

  const pickerLabels = {
    legendFree: labels.table.pickerFree,
    legendOccupied: labels.table.pickerOccupied,
    legendSelected: labels.table.pickerSelected,
    pickHint: labels.table.pickerHint,
  };

  const floorSwitcherLabels = {
    floor: labels.table.floor,
    floorUp: labels.table.floorUp,
    floorDown: labels.table.floorDown,
    switchFloor: labels.table.switchFloor,
    selectSurface: labels.table.selectSurface,
    unconfiguredFloor: labels.table.unconfiguredFloor,
  };

  const floorNameLabels = {
    surfaceNameBasement: labels.table.surfaceNameBasement,
    surfaceNameGround: labels.table.surfaceNameGround,
    surfaceNameFloor: labels.table.surfaceNameFloor,
  };

  function handleSelectTable(tableNumber: string) {
    selection.clearManualSurface();
    onTableNumberChange(tableNumber);
  }

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
            <TbPlus className="size-4" aria-hidden />
            {labels.actions.addCustomer}
          </Button>
        </CardHeader>
        <CardContent>
          <FieldGroup>
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

      {isDineIn ? (
        <Card>
          <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle>{labels.table.title}</CardTitle>
              <CardDescription>{labels.table.description}</CardDescription>
            </div>
            {hasFloorPlan ? (
              <Button
                type="button"
                variant="secondary"
                className="gap-2"
                onClick={() => setPickerDialogOpen(true)}
              >
                <TbArrowsMaximize className="size-4" aria-hidden />
                {labels.table.expandPicker}
              </Button>
            ) : null}
          </CardHeader>
          <CardContent>
            <Field data-invalid={Boolean(errors.tableNumber)}>
              <FieldLabel htmlFor="table-number">
                {labels.table.number}
              </FieldLabel>
              {hasFloorPlan && activeSurface ? (
                <>
                  <FloorPlanFloorSwitcher
                    surfaces={floorPlanSurfaces}
                    currentFloor={selection.currentFloor}
                    activeSurfaceId={selection.activeSurfaceId}
                    labels={floorSwitcherLabels}
                    floorNameLabels={floorNameLabels}
                    canFloorUp={selection.canFloorUp}
                    canFloorDown={selection.canFloorDown}
                    onFloorUp={() => selection.navigateFloor("up")}
                    onFloorDown={() => selection.navigateFloor("down")}
                    onSelectSurface={selection.selectSurface}
                    className="mb-3"
                  />
                  <FloorPlanTablePicker
                    surface={activeSurface}
                    occupiedTableNumbers={occupiedTableNumbers}
                    selectedTableNumber={values.tableNumber}
                    onSelectTable={handleSelectTable}
                    labels={pickerLabels}
                  />
                  <TableNumberSelect
                    id="table-number"
                    className="mt-3"
                    value={values.tableNumber}
                    tableNumbers={tableNumbers}
                    occupiedTableNumbers={occupiedTableNumbers}
                    placeholder={labels.table.numberPlaceholder}
                    occupiedLabel={labels.table.pickerOccupied}
                    invalid={Boolean(errors.tableNumber)}
                    onChange={handleSelectTable}
                  />
                </>
              ) : (
                <>
                  <TableNumberSelect
                    id="table-number"
                    value={values.tableNumber}
                    tableNumbers={tableNumbers}
                    occupiedTableNumbers={occupiedTableNumbers}
                    placeholder={labels.table.numberPlaceholder}
                    occupiedLabel={labels.table.pickerOccupied}
                    invalid={Boolean(errors.tableNumber)}
                    disabled
                    onChange={onTableNumberChange}
                  />
                  <p className="mt-2 text-sm text-muted-foreground">
                    {labels.table.configureFloorPlan}{" "}
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
          </CardContent>
        </Card>
      ) : null}

      {hasFloorPlan ? (
        <FloorPlanTablePickerDialog
          open={pickerDialogOpen}
          onOpenChange={setPickerDialogOpen}
          surfaces={floorPlanSurfaces}
          occupiedTableNumbers={occupiedTableNumbers}
          selectedTableNumber={values.tableNumber}
          onSelectTable={handleSelectTable}
          labels={{
            title: labels.table.pickerDialogTitle,
            description: labels.table.pickerDialogDescription,
            legendFree: labels.table.pickerFree,
            legendOccupied: labels.table.pickerOccupied,
            legendSelected: labels.table.pickerSelected,
            pickHint: labels.table.pickerHint,
            floorSwitcher: floorSwitcherLabels,
            floorName: floorNameLabels,
          }}
        />
      ) : null}

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
      <p className="text-sm text-muted-foreground">
        {labels.customer.selectedHint}
      </p>
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
      <FieldLabel>{labels.customer.selectedTitle}</FieldLabel>
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

function formatCustomerSubtitle(customer: NewOrderSelectedCustomer) {
  return [customer.documentId, customer.phone, customer.email]
    .map((value) => value.trim())
    .filter(Boolean)
    .join(" · ");
}
