"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { CustomerOption } from "@/lib/customers/types";
import type { CustomerSavedSegmentSummary } from "@/lib/customers/saved-segments.types";
import { useAddSavedCustomerSegmentMembersMutation } from "@/lib/query/customers/saved-segments.mutations";
import type { CustomersLabels } from "./types";

type AddCustomersToSegmentDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  labels: CustomersLabels["savedSegments"];
  restaurantId: string;
  segment: CustomerSavedSegmentSummary | null;
  customers: CustomerOption[];
  onImportCustomers: () => void;
  onSuccess: () => void;
};

function getCheckState(
  customerIds: string[],
  selectedCustomerIds: Set<string>,
): boolean | "indeterminate" {
  const selectedCount = customerIds.filter((id) =>
    selectedCustomerIds.has(id),
  ).length;

  if (selectedCount === 0) {
    return false;
  }

  if (selectedCount === customerIds.length) {
    return true;
  }

  return "indeterminate";
}

export function AddCustomersToSegmentDialog({
  open,
  onOpenChange,
  labels,
  restaurantId,
  segment,
  customers,
  onImportCustomers,
  onSuccess,
}: AddCustomersToSegmentDialogProps) {
  const [search, setSearch] = useState("");
  const [selectedCustomerIds, setSelectedCustomerIds] = useState<Set<string>>(
    () => new Set(),
  );
  const addMembersMutation = useAddSavedCustomerSegmentMembersMutation(restaurantId);

  function resetForm() {
    setSearch("");
    setSelectedCustomerIds(new Set());
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      resetForm();
    }

    onOpenChange(nextOpen);
  }

  const filteredCustomers = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return customers;
    }

    return customers.filter((customer) => {
      const haystack = [
        customer.name,
        customer.phone ?? "",
        customer.email ?? "",
        customer.documentId ?? "",
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [customers, search]);

  const visibleIds = filteredCustomers.map((customer) => customer.id);
  const pageCheckState = getCheckState(visibleIds, selectedCustomerIds);

  function toggleCustomer(customerId: string, checked: boolean) {
    const next = new Set(selectedCustomerIds);

    if (checked) {
      next.add(customerId);
    } else {
      next.delete(customerId);
    }

    setSelectedCustomerIds(next);
  }

  function toggleAllVisible(checked: boolean) {
    if (!checked) {
      const next = new Set(selectedCustomerIds);
      for (const customerId of visibleIds) {
        next.delete(customerId);
      }
      setSelectedCustomerIds(next);
      return;
    }

    setSelectedCustomerIds(new Set([...selectedCustomerIds, ...visibleIds]));
  }

  async function handleSubmit() {
    if (!segment) {
      return;
    }

    const customerIds = [...selectedCustomerIds];

    if (customerIds.length === 0) {
      toast.error(labels.noCustomersSelected);
      return;
    }

    try {
      await addMembersMutation.mutateAsync({
        segmentId: segment.id,
        customerIds,
      });
      toast.success(labels.addedToExisting);
      handleOpenChange(false);
      onSuccess();
    } catch {
      toast.error(labels.saveError);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="flex max-h-[min(90vh,720px)] flex-col sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{labels.addCustomersTitle}</DialogTitle>
          <DialogDescription>
            {segment
              ? labels.addCustomersDescription.replace("{name}", segment.name)
              : labels.addCustomersDescriptionFallback}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="segment-customer-search">{labels.search}</Label>
            <Input
              id="segment-customer-search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={labels.searchPlaceholder}
            />
          </div>

          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={pageCheckState}
                onCheckedChange={(checked) => toggleAllVisible(checked === true)}
                aria-label={labels.selectAllCustomers}
              />
              <span className="text-sm text-muted-foreground">
                {labels.selectedCount.replace(
                  "{count}",
                  String(selectedCustomerIds.size),
                )}
              </span>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={onImportCustomers}>
              {labels.importCustomer}
            </Button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto rounded-2xl border border-border/70">
            {filteredCustomers.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground">{labels.empty}</p>
            ) : (
              <ul className="divide-y divide-border/70">
                {filteredCustomers.map((customer) => (
                  <li key={customer.id}>
                    <label className="flex cursor-pointer items-start gap-3 p-3 hover:bg-muted/30">
                      <Checkbox
                        checked={selectedCustomerIds.has(customer.id)}
                        onCheckedChange={(checked) =>
                          toggleCustomer(customer.id, checked === true)
                        }
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block font-medium">{customer.name}</span>
                        <span className="mt-1 block text-sm text-muted-foreground">
                          {customer.phone ?? customer.email ?? "—"}
                        </span>
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={addMembersMutation.isPending}
          >
            {labels.cancel}
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={addMembersMutation.isPending || !segment}
          >
            {labels.addCustomers}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
