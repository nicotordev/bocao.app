"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { importCustomersFromRestaurantsAction } from "@/app/actions/customers-import";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useImportableCustomersQuery } from "@/lib/query/customers/import-customers.queries";
import { ImportCustomersFileTab } from "./import-customers-file-tab";
import { ImportCustomersReuseTab } from "./import-customers-reuse-tab";
import type { CustomersLabels } from "./types";

type ImportCustomersDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  labels: CustomersLabels;
  restaurantId: string;
  onSuccess: () => void;
};

export function ImportCustomersDialog({
  open,
  onOpenChange,
  labels,
  restaurantId,
  onSuccess,
}: ImportCustomersDialogProps) {
  const importLabels = labels.importCustomers;
  const [activeTab, setActiveTab] = useState<"reuse" | "file">("reuse");
  const [selectedCustomerIds, setSelectedCustomerIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [isImporting, startImport] = useTransition();

  const importableQuery = useImportableCustomersQuery(restaurantId, open);
  const selectedCount = selectedCustomerIds.size;

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      setSelectedCustomerIds(new Set());
      setActiveTab("reuse");
    }

    onOpenChange(nextOpen);
  }

  function handleReuseImport() {
    if (selectedCount === 0) {
      toast.error(importLabels.noCustomersSelected);
      return;
    }

    startImport(async () => {
      const result = await importCustomersFromRestaurantsAction({
        restaurantId,
        customerIds: Array.from(selectedCustomerIds),
      });

      if (!result.ok) {
        const message =
          result.error === "NO_CUSTOMERS_SELECTED"
            ? importLabels.noCustomersSelected
            : importLabels.importFailed;
        toast.error(message);
        return;
      }

      toast.success(importLabels.importedSuccessfully);
      handleOpenChange(false);
      onSuccess();
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="flex h-[min(94vh,980px)] w-[min(98vw,88rem)] max-w-none flex-col gap-0 overflow-hidden p-0 sm:max-w-[min(98vw,88rem)]">
        <DialogHeader className="shrink-0 border-b border-border px-6 py-5">
          <DialogTitle>{importLabels.title}</DialogTitle>
          <DialogDescription>{importLabels.description}</DialogDescription>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as "reuse" | "file")}
          className="flex min-h-0 flex-1 flex-col overflow-hidden"
        >
          <div className="shrink-0 space-y-2 border-b border-border px-6 py-4">
            <p className="text-sm font-medium text-muted-foreground">
              {importLabels.importMode}
            </p>
            <TabsList className="rounded-2xl">
              <TabsTrigger value="reuse" className="rounded-xl">
                {importLabels.reuseFromRestaurants}
              </TabsTrigger>
              <TabsTrigger value="file" className="rounded-xl">
                {importLabels.importFromFile}
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent
            value="reuse"
            className="mt-0 flex min-h-0 flex-1 flex-col overflow-hidden px-6 py-4 data-[state=inactive]:hidden"
          >
            {importableQuery.isLoading ? (
              <div className="flex flex-1 items-center justify-center py-16 text-sm text-muted-foreground">
                {importLabels.loading}
              </div>
            ) : importableQuery.isError ? (
              <div className="flex flex-1 flex-col items-center justify-center py-16 text-center">
                <p className="font-medium">{importLabels.error}</p>
              </div>
            ) : (
              <ImportCustomersReuseTab
                labels={importLabels}
                customers={importableQuery.data?.customers ?? []}
                selectedCustomerIds={selectedCustomerIds}
                onSelectedCustomerIdsChange={setSelectedCustomerIds}
              />
            )}
          </TabsContent>

          <TabsContent
            value="file"
            className="mt-0 flex min-h-0 flex-1 flex-col overflow-y-auto px-6 py-4 data-[state=inactive]:hidden"
          >
            <ImportCustomersFileTab
              labels={importLabels}
              restaurantId={restaurantId}
              onImportSuccess={() => {
                handleOpenChange(false);
                onSuccess();
              }}
            />
          </TabsContent>
        </Tabs>

        {activeTab === "reuse" ? (
          <DialogFooter className="shrink-0 border-t border-border px-6 py-4">
            <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">
                {importLabels.selectedCount.replace(
                  "{count}",
                  String(selectedCount),
                )}
              </p>

              <div className="flex flex-wrap justify-end gap-2">
                <Button
                  variant="outline"
                  className="rounded-2xl"
                  onClick={() => handleOpenChange(false)}
                  disabled={isImporting}
                >
                  {importLabels.cancel}
                </Button>
                <Button
                  className="rounded-2xl"
                  disabled={selectedCount === 0 || isImporting}
                  onClick={handleReuseImport}
                >
                  {isImporting
                    ? importLabels.importing
                    : importLabels.importSelected}
                </Button>
              </div>
            </div>
          </DialogFooter>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
