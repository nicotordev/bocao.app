"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { BulkCustomerTagsDialog } from "./bulk-customer-tags-dialog";
import { CustomerDialog } from "./customer-dialog";
import { CustomerProfileDialog } from "./customer-profile-dialog";
import { DebouncedSearchDraft } from "@/components/dashboard/url-synced-draft";
import { ListPagination } from "@/components/dashboard/list-pagination";
import { QueryResultState } from "@/components/query/query-result-state";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { buildListUrl } from "@/lib/list-url";
import {
  areCustomersListFiltersEqual,
  buildTargetCustomersListFilters,
  parseCustomersListSearchParams,
  type CustomersListFilterPatch,
  type CustomersListFilters,
} from "@/lib/customers/filters";
import type {
  CustomerListItem,
  CustomerOption,
  CustomerSegmentCard,
} from "@/lib/customers/types";
import { useBulkCustomerTagsMutation } from "@/lib/query/customers/customer-tags.mutations";
import { useCustomerTagsQuery } from "@/lib/query/customers/customer-tags.queries";
import {
  useCreateCustomerMutation,
  useDeleteCustomersMutation,
  useUpdateCustomerMutation,
} from "@/lib/query/customers/customers.mutations";
import {
  useCustomerDetailQuery,
  useCustomersPageQuery,
} from "@/lib/query/customers/customers.queries";
import { queryKeys } from "@/lib/query/query-keys";
import { ImportCustomersDialog } from "./import-customers-dialog";
import { CustomerInsightsCard } from "./customer-insights-card";
import { CustomersActivityFeed } from "./customers-activity-feed";
import { CustomersHeader } from "./customers-header";
import { CustomersKpis } from "./customers-kpis";
import { CustomersSegments } from "./customers-segments";
import { CustomersBulkActionsBar } from "./customers-bulk-actions-bar";
import { DeleteCustomersConfirmDialog } from "./delete-customers-confirm-dialog";
import { SaveCustomersSegmentDialog } from "./save-customers-segment-dialog";
import { CustomersTable } from "./customers-table";
import {
  CustomersToolbar,
  type CustomersToolbarState,
} from "./customers-toolbar";
import type { CustomerSegmentLabelMap, CustomersLabels } from "./types";

type CustomersPageClientProps = {
  labels: CustomersLabels;
  segmentLabels: CustomerSegmentLabelMap;
  restaurantId: string;
  organizationId: string;
  customerOptions: CustomerOption[];
};

function buildCustomersCsv(customers: CustomerListItem[]) {
  const header = [
    "name",
    "email",
    "phone",
    "segment",
    "orders",
    "total_spend",
    "average_ticket",
    "last_visit",
    "channel",
  ];

  const safeCustomers = Array.isArray(customers) ? customers : [];

  const rows = safeCustomers.map((customer) => [
    customer.name,
    customer.email ?? "",
    customer.phone ?? "",
    customer.segment,
    String(customer.orderCount),
    customer.totalSpend,
    customer.averageTicket,
    customer.lastVisitRelative,
    customer.primaryChannel,
  ]);

  return [header, ...rows]
    .map((row) =>
      row.map((value) => `"${value.replaceAll('"', '""')}"`).join(","),
    )
    .join("\n");
}

function downloadCsvFile(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function mapSegmentCardToFilter(
  segmentId: CustomerSegmentCard["id"],
): CustomersToolbarState["segment"] {
  if (segmentId === "reservation_frequent") {
    return "frequent";
  }

  if (segmentId === "high_value") {
    return "high_value";
  }

  return segmentId;
}

const EMPTY_CUSTOMERS: CustomerListItem[] = [];

function buildCustomersHref(filters: CustomersListFilters) {
  const segment = filters.segment ?? "all";
  const channel = filters.channel ?? "all";
  const sort = filters.sort ?? "last_visit";
  const tab = filters.tab ?? "customers";

  return buildListUrl(
    "/dashboard/customers",
    {
      search: filters.search,
      segment: segment === "all" ? undefined : segment,
      channel: channel === "all" ? undefined : channel,
      sort: sort === "last_visit" ? undefined : sort,
      tab: tab === "customers" ? undefined : tab,
      customerId: filters.customerId,
      savedSegmentId: filters.savedSegmentId,
    },
    {
      page: filters.page,
      pageSize: filters.pageSize,
    },
  );
}

export function CustomersPageClient({
  labels,
  segmentLabels,
  restaurantId,
  organizationId,
  customerOptions,
}: CustomersPageClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const [customerDialogMode, setCustomerDialogMode] = useState<
    "create" | "edit" | null
  >(null);
  const [editingCustomerId, setEditingCustomerId] = useState<string | null>(
    null,
  );
  const [bulkTagOperation, setBulkTagOperation] = useState<
    "add" | "remove" | null
  >(null);
  const [singleTagCustomerIds, setSingleTagCustomerIds] = useState<string[]>(
    [],
  );
  const [importCustomersDialogOpen, setImportCustomersDialogOpen] =
    useState(false);
  const [saveSegmentDialogOpen, setSaveSegmentDialogOpen] = useState(false);
  const [selectedCustomerIds, setSelectedCustomerIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTargets, setDeleteTargets] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const createCustomerMutation = useCreateCustomerMutation(restaurantId);
  const updateCustomerMutation = useUpdateCustomerMutation(restaurantId);
  const deleteCustomersMutation = useDeleteCustomersMutation(restaurantId);
  const bulkTagsMutation = useBulkCustomerTagsMutation(restaurantId);
  const customerTagsQuery = useCustomerTagsQuery(organizationId);
  const filters = useMemo(
    () =>
      parseCustomersListSearchParams(
        Object.fromEntries(searchParams.entries()),
      ),
    [searchParams],
  );
  const urlSearch = filters.search ?? "";
  const selectedCustomerId = filters.customerId ?? null;

  const customersQuery = useCustomersPageQuery(restaurantId, filters);
  const profileCustomerId = selectedCustomerId;
  const editCustomerId =
    customerDialogMode === "edit" ? editingCustomerId : null;
  const detailQuery = useCustomerDetailQuery(
    restaurantId,
    profileCustomerId ?? editCustomerId ?? "",
    Boolean(profileCustomerId || editCustomerId),
  );

  const pageData = customersQuery.data;
  const customers = pageData?.customers ?? EMPTY_CUSTOMERS;

  const selectionScopeKey = [
    restaurantId,
    filters.page,
    filters.pageSize,
    filters.search ?? "",
    filters.segment ?? "all",
    filters.channel ?? "all",
    filters.sort ?? "last_visit",
    filters.savedSegmentId ?? "",
  ].join("\0");

  const [prevSelectionScopeKey, setPrevSelectionScopeKey] =
    useState(selectionScopeKey);

  if (selectionScopeKey !== prevSelectionScopeKey) {
    setPrevSelectionScopeKey(selectionScopeKey);
    setSelectedCustomerIds(new Set());
  }

  const pagination = pageData?.pagination ?? {
    page: filters.page,
    pageSize: filters.pageSize,
    total: 0,
    totalPages: 1,
  };
  const kpis = pageData?.kpis ?? {
    total: 0,
    frequent: 0,
    averageTicket: "—",
    inactive: 0,
    trends: {
      total: { change: labels.kpis.notAvailable, trend: "neutral" as const },
      frequent: { change: labels.kpis.notAvailable, trend: "neutral" as const },
      averageTicket: {
        change: labels.kpis.notAvailable,
        trend: "neutral" as const,
      },
      inactive: { change: labels.kpis.notAvailable, trend: "neutral" as const },
    },
  };

  const toolbarValue: CustomersToolbarState = {
    search: urlSearch,
    segment: filters.segment ?? "all",
    channel: filters.channel ?? "all",
    sort: filters.sort ?? "last_visit",
  };

  const navigateFilters = useCallback(
    (next: CustomersListFilterPatch, options?: { page?: number }) => {
      const targetFilters = buildTargetCustomersListFilters(
        filters,
        next,
        options,
      );

      if (areCustomersListFiltersEqual(filters, targetFilters)) {
        return;
      }

      router.replace(buildCustomersHref(targetFilters));
    },
    [filters, router],
  );

  const handleDebouncedSearch = useCallback(
    (search: string) => navigateFilters({ search }),
    [navigateFilters],
  );

  const handleExport = (rows: CustomerListItem[] = customers) => {
    if (!rows || rows.length === 0) {
      toast.error(labels.actions.exportEmpty);
      return;
    }

    const csv = buildCustomersCsv(rows);
    // Only export if CSV is not empty or just a header row (i.e., no real data)
    if (!csv || csv.trim().split("\n").length <= 1) {
      toast.error(labels.actions.exportEmpty);
      return;
    }

    downloadCsvFile(
      `customers-${new Date().toISOString().slice(0, 10)}.csv`,
      csv,
    );
    toast.success(labels.actions.exportSuccess);
  };

  const selectedCustomers = useMemo(
    () => customers.filter((customer) => selectedCustomerIds.has(customer.id)),
    [customers, selectedCustomerIds],
  );

  const openDeleteDialog = useCallback(
    (targets: Array<{ id: string; name: string }>) => {
      if (targets.length === 0) {
        return;
      }

      setDeleteTargets(targets);
      setDeleteDialogOpen(true);
    },
    [],
  );

  const handleConfirmDelete = async () => {
    if (deleteTargets.length === 0) {
      return;
    }

    try {
      const deletedCount = await deleteCustomersMutation.mutateAsync(
        deleteTargets.map((target) => target.id),
      );

      toast.success(
        deletedCount > 1
          ? labels.deleteDialog.successBulk.replace(
              "{count}",
              String(deletedCount),
            )
          : labels.deleteDialog.success,
      );

      const deletedIds = new Set(deleteTargets.map((target) => target.id));

      if (selectedCustomerId && deletedIds.has(selectedCustomerId)) {
        navigateFilters({ customerId: undefined });
      }

      setSelectedCustomerIds((current) => {
        const next = new Set(current);
        for (const id of deletedIds) {
          next.delete(id);
        }
        return next;
      });
      setDeleteDialogOpen(false);
      setDeleteTargets([]);
      refreshCustomersPage();
    } catch {
      toast.error(labels.feedback.deleteError);
    }
  };

  const handleSelectCustomer = (customer: CustomerListItem) => {
    navigateFilters({ customerId: customer.id });
  };

  const handleDrawerOpenChange = (open: boolean) => {
    if (!open && selectedCustomerId !== null) {
      navigateFilters({ customerId: undefined });
    }
  };

  const handleViewSegmentCustomers = (segmentId: CustomerSegmentCard["id"]) => {
    navigateFilters({
      segment: mapSegmentCardToFilter(segmentId),
      savedSegmentId: undefined,
      tab: "customers",
    });
  };

  const handleViewSavedSegmentCustomers = (savedSegmentId: string) => {
    navigateFilters({
      segment: "all",
      savedSegmentId,
      tab: "customers",
    });
  };

  const refreshCustomersPage = () => {
    void queryClient.invalidateQueries({
      queryKey: queryKeys.customers.pages(),
    });
    router.refresh();
  };

  const activeTab = filters.tab ?? "customers";

  const customerDialogLabels = {
    ...labels.formDialog,
    tags: labels.tags,
    createTitle: labels.customerDialog.createTitle,
    createDescription: labels.customerDialog.createDescription,
    createButton: labels.customerDialog.createButton,
    editTitle: labels.customerDialog.editTitle,
    editDescription: labels.customerDialog.editDescription,
    editButton: labels.customerDialog.editButton,
    createSuccess: labels.customerDialog.createSuccess,
    editSuccess: labels.customerDialog.editSuccess,
  };

  const handleCustomerDialogSubmit = async (input: {
    name: string;
    phone: string;
    email: string;
    documentId: string;
    address: string;
    notes: string;
    avatar: string;
    tagIds: string[];
  }) => {
    const payload = {
      name: input.name,
      phone: input.phone || undefined,
      email: input.email || undefined,
      documentId: input.documentId || undefined,
      address: input.address || undefined,
      notes: input.notes || undefined,
      avatar: input.avatar || undefined,
      tagIds: input.tagIds,
    };

    try {
      if (customerDialogMode === "edit" && editingCustomerId) {
        await updateCustomerMutation.mutateAsync({
          customerId: editingCustomerId,
          input: payload,
        });
        refreshCustomersPage();
        return;
      }

      const customer = await createCustomerMutation.mutateAsync(payload);
      navigateFilters({ customerId: customer.id, tab: "customers" });
      refreshCustomersPage();
    } catch {
      toast.error(
        customerDialogMode === "edit"
          ? labels.feedback.updateError
          : labels.feedback.createError,
      );
      throw new Error("CUSTOMER_SAVE_FAILED");
    }
  };

  const handleBulkTagsConfirm = async (tagIds: string[]) => {
    const operation = bulkTagOperation ?? "add";
    const customerIds =
      singleTagCustomerIds.length > 0
        ? singleTagCustomerIds
        : [...selectedCustomerIds];

    await bulkTagsMutation.mutateAsync({
      customerIds,
      tagIds,
      operation,
    });

    setSelectedCustomerIds(new Set());
    setSingleTagCustomerIds([]);
    refreshCustomersPage();
  };

  return (
    <main className="flex flex-col gap-6 p-4 md:p-6">
      <CustomersHeader
        labels={labels}
        onExport={handleExport}
        onNewCustomer={() => {
          setEditingCustomerId(null);
          setCustomerDialogMode("create");
        }}
        onImportCustomers={() => setImportCustomersDialogOpen(true)}
      />
      <CustomersKpis labels={labels.kpis} values={kpis} />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          <DebouncedSearchDraft
            urlSearch={urlSearch}
            onDebouncedChange={handleDebouncedSearch}
          >
            {(searchDraft, setSearchDraft) => (
              <CustomersToolbar
                labels={labels}
                value={{ ...toolbarValue, search: searchDraft }}
                onSearchChange={setSearchDraft}
                onFiltersChange={(value) => navigateFilters(value)}
                onClear={() => {
                  setSearchDraft("");
                  navigateFilters({
                    search: "",
                    segment: "all",
                    channel: "all",
                    sort: "last_visit",
                    tab: "customers",
                    customerId: undefined,
                    savedSegmentId: undefined,
                  });
                }}
              />
            )}
          </DebouncedSearchDraft>

          <Tabs
            value={activeTab}
            onValueChange={(tab) => {
              const nextTab = tab as CustomersListFilters["tab"];
              if (nextTab === activeTab) {
                return;
              }

              navigateFilters({ tab: nextTab });
            }}
          >
            <TabsList>
              <TabsTrigger value="customers">
                {labels.tabs.customers}
              </TabsTrigger>
              <TabsTrigger value="segments">{labels.tabs.segments}</TabsTrigger>
              <TabsTrigger value="activity">{labels.tabs.activity}</TabsTrigger>
            </TabsList>

            <TabsContent value="customers" className="mt-4 space-y-4">
              <QueryResultState query={customersQuery}>
                {() => (
                  <>
                    <CustomersBulkActionsBar
                      labels={labels.bulkActions}
                      selectedCount={selectedCustomerIds.size}
                      onClearSelection={() => setSelectedCustomerIds(new Set())}
                      onExport={() => handleExport(selectedCustomers)}
                      onSaveToSegment={() => setSaveSegmentDialogOpen(true)}
                      onAddTag={() => {
                        setSingleTagCustomerIds([]);
                        setBulkTagOperation("add");
                      }}
                      onRemoveTag={() => {
                        setSingleTagCustomerIds([]);
                        setBulkTagOperation("remove");
                      }}
                      onDelete={() =>
                        openDeleteDialog(
                          selectedCustomers.map((customer) => ({
                            id: customer.id,
                            name: customer.name,
                          })),
                        )
                      }
                    />
                    <CustomersTable
                      labels={labels}
                      segmentLabels={segmentLabels}
                      customers={customers}
                      selectedCustomerIds={selectedCustomerIds}
                      onSelectedCustomerIdsChange={setSelectedCustomerIds}
                      onSelectCustomer={handleSelectCustomer}
                      onEditCustomer={(customer) => {
                        if (selectedCustomerId) {
                          navigateFilters({ customerId: undefined });
                        }
                        setEditingCustomerId(customer.id);
                        setCustomerDialogMode("edit");
                      }}
                      onAddTags={(customer) => {
                        setSingleTagCustomerIds([customer.id]);
                        setBulkTagOperation("add");
                      }}
                      onDeleteCustomer={(customer) =>
                        openDeleteDialog([
                          { id: customer.id, name: customer.name },
                        ])
                      }
                      onImportCustomers={() =>
                        setImportCustomersDialogOpen(true)
                      }
                    />
                    <ListPagination
                      basePath="/dashboard/customers"
                      labels={labels.pagination}
                      meta={pagination}
                      params={{
                        search: toolbarValue.search || undefined,
                        segment:
                          toolbarValue.segment === "all"
                            ? undefined
                            : toolbarValue.segment,
                        channel:
                          toolbarValue.channel === "all"
                            ? undefined
                            : toolbarValue.channel,
                        sort:
                          toolbarValue.sort === "last_visit"
                            ? undefined
                            : toolbarValue.sort,
                        tab: activeTab === "customers" ? undefined : activeTab,
                        customerId: selectedCustomerId ?? undefined,
                        savedSegmentId: filters.savedSegmentId,
                      }}
                    />
                  </>
                )}
              </QueryResultState>
            </TabsContent>

            <TabsContent value="segments" className="mt-4">
              <CustomersSegments
                labels={labels}
                segments={pageData?.segments ?? []}
                savedSegments={pageData?.savedSegments ?? []}
                customerOptions={customerOptions}
                restaurantId={restaurantId}
                onViewCustomers={handleViewSegmentCustomers}
                onViewSavedSegment={handleViewSavedSegmentCustomers}
                onImportCustomers={() => setImportCustomersDialogOpen(true)}
                onSegmentsChanged={refreshCustomersPage}
              />
            </TabsContent>

            <TabsContent value="activity" className="mt-4">
              <CustomersActivityFeed
                labels={labels}
                events={pageData?.activity ?? []}
                onSelectCustomer={(customerId) => {
                  navigateFilters({ customerId });
                }}
              />
            </TabsContent>
          </Tabs>
        </div>

        <aside className="space-y-4">
          <CustomerInsightsCard
            labels={labels}
            insights={pageData?.insights ?? []}
          />
        </aside>
      </div>

      <CustomerProfileDialog
        labels={labels}
        segmentLabels={segmentLabels}
        customer={profileCustomerId ? (detailQuery.data ?? null) : null}
        open={profileCustomerId !== null}
        onOpenChange={handleDrawerOpenChange}
      />

      <CustomerDialog
        mode={customerDialogMode === "edit" ? "edit" : "create"}
        open={customerDialogMode !== null}
        onOpenChange={(open) => {
          if (!open) {
            setCustomerDialogMode(null);
            setEditingCustomerId(null);
          }
        }}
        labels={customerDialogLabels}
        restaurantId={restaurantId}
        organizationId={organizationId}
        customer={
          customerDialogMode === "edit" ? (detailQuery.data ?? null) : null
        }
        editCustomerId={editingCustomerId}
        isSubmitting={
          createCustomerMutation.isPending || updateCustomerMutation.isPending
        }
        onSubmit={handleCustomerDialogSubmit}
      />

      <BulkCustomerTagsDialog
        open={bulkTagOperation !== null}
        onOpenChange={(open) => {
          if (!open) {
            setBulkTagOperation(null);
            setSingleTagCustomerIds([]);
          }
        }}
        operation={bulkTagOperation ?? "add"}
        labels={labels.tags.bulk}
        tags={customerTagsQuery.data ?? []}
        customerCount={
          singleTagCustomerIds.length > 0
            ? singleTagCustomerIds.length
            : selectedCustomerIds.size
        }
        isPending={bulkTagsMutation.isPending}
        onConfirm={handleBulkTagsConfirm}
      />

      <ImportCustomersDialog
        open={importCustomersDialogOpen}
        onOpenChange={setImportCustomersDialogOpen}
        labels={labels}
        restaurantId={restaurantId}
        onSuccess={refreshCustomersPage}
      />

      <SaveCustomersSegmentDialog
        open={saveSegmentDialogOpen}
        onOpenChange={setSaveSegmentDialogOpen}
        labels={labels.savedSegments}
        restaurantId={restaurantId}
        customerIds={[...selectedCustomerIds]}
        savedSegments={pageData?.savedSegments ?? []}
        onSuccess={() => {
          setSelectedCustomerIds(new Set());
          refreshCustomersPage();
        }}
      />

      <DeleteCustomersConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        labels={labels.deleteDialog}
        customers={deleteTargets}
        isPending={deleteCustomersMutation.isPending}
        onConfirm={handleConfirmDelete}
      />
    </main>
  );
}
