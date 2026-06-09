"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { NewCustomerDialog } from "@/components/dashboard/orders/new/new-customer-dialog";
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
  CustomerSegmentCard,
} from "@/lib/customers/types";
import { useCreateCustomerMutation } from "@/lib/query/customers/customers.mutations";
import {
  useCustomerDetailQuery,
  useCustomersPageQuery,
} from "@/lib/query/customers/customers.queries";
import { queryKeys } from "@/lib/query/query-keys";
import { ImportCustomersDialog } from "./import-customers-dialog";
import { CustomerDrawer } from "./customer-drawer";
import { CustomerInsightsCard } from "./customer-insights-card";
import { CustomersActivityFeed } from "./customers-activity-feed";
import { CustomersHeader } from "./customers-header";
import { CustomersKpis } from "./customers-kpis";
import { CustomersSegments } from "./customers-segments";
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

  const rows = customers.map((customer) => [
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
      row
        .map((value) => `"${value.replaceAll('"', '""')}"`)
        .join(","),
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
}: CustomersPageClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [newCustomerDialogOpen, setNewCustomerDialogOpen] = useState(false);
  const createCustomerMutation = useCreateCustomerMutation(restaurantId);
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
  const detailQuery = useCustomerDetailQuery(
    restaurantId,
    selectedCustomerId ?? "",
    Boolean(selectedCustomerId),
  );

  const pageData = customersQuery.data;
  const customers = pageData?.customers ?? [];
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

  const handleExport = () => {
    if (customers.length === 0) {
      toast.error(labels.actions.exportEmpty);
      return;
    }

    downloadCsvFile(
      `customers-${new Date().toISOString().slice(0, 10)}.csv`,
      buildCustomersCsv(customers),
    );
    toast.success(labels.actions.exportSuccess);
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
      tab: "customers",
    });
  };

  const activeTab = filters.tab ?? "customers";

  const handleCreateCustomer = async (input: {
    name: string;
    phone: string;
    email: string;
    documentId: string;
    address: string;
    notes: string;
    avatar: string;
  }) => {
    try {
      const customer = await createCustomerMutation.mutateAsync({
        name: input.name,
        phone: input.phone || undefined,
        email: input.email || undefined,
        documentId: input.documentId || undefined,
        address: input.address || undefined,
        notes: input.notes || undefined,
        avatar: input.avatar || undefined,
      });

      navigateFilters({ customerId: customer.id, tab: "customers" });
    } catch {
      toast.error(labels.feedback.createError);
      throw new Error(labels.feedback.createError);
    }
  };

  return (
    <main className="flex flex-col gap-6 p-4 md:p-6">
      <CustomersHeader
        labels={labels}
        onExport={handleExport}
        onNewCustomer={() => setNewCustomerDialogOpen(true)}
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
              <TabsTrigger value="customers">{labels.tabs.customers}</TabsTrigger>
              <TabsTrigger value="segments">{labels.tabs.segments}</TabsTrigger>
              <TabsTrigger value="activity">{labels.tabs.activity}</TabsTrigger>
            </TabsList>

            <TabsContent value="customers" className="mt-4 space-y-4">
              <QueryResultState query={customersQuery}>
                {() => (
                  <>
                    <CustomersTable
                      labels={labels}
                      segmentLabels={segmentLabels}
                      customers={customers}
                      onSelectCustomer={handleSelectCustomer}
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
                onViewCustomers={handleViewSegmentCustomers}
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

      <CustomerDrawer
        labels={labels}
        segmentLabels={segmentLabels}
        customer={detailQuery.data ?? null}
        open={selectedCustomerId !== null}
        onOpenChange={handleDrawerOpenChange}
      />

      <NewCustomerDialog
        open={newCustomerDialogOpen}
        onOpenChange={setNewCustomerDialogOpen}
        labels={labels.formDialog}
        restaurantId={restaurantId}
        onAddCustomer={handleCreateCustomer}
      />
    </main>
  );
}
