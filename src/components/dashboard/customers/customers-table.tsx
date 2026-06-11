"use client";

import { TbPencil, TbEye, TbDots, TbTag, TbTrash } from "react-icons/tb";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { CustomerListItem } from "@/lib/customers/types";
import { CustomerChannelBadge } from "./customer-channel-badge";
import { CustomerSegmentBadge } from "./customer-segment-badge";
import { CustomersEmptyState } from "./customers-empty-state";
import type { CustomerSegmentLabelMap, CustomersLabels } from "./types";

type CustomersTableProps = {
  labels: CustomersLabels;
  segmentLabels: CustomerSegmentLabelMap;
  customers: CustomerListItem[];
  selectedCustomerIds: Set<string>;
  onSelectedCustomerIdsChange: (next: Set<string>) => void;
  onSelectCustomer: (customer: CustomerListItem) => void;
  onEditCustomer: (customer: CustomerListItem) => void;
  onAddTags: (customer: CustomerListItem) => void;
  onDeleteCustomer: (customer: CustomerListItem) => void;
  onImportCustomers: () => void;
  onPrefetchCustomer?: (customerId: string) => void;
};

function stopRowActivation(event: React.SyntheticEvent) {
  event.stopPropagation();
}

function getPageCheckState(
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

function CustomerActions({
  labels,
  onViewProfile,
  onEdit,
  onAddTags,
  onDelete,
}: {
  labels: CustomersLabels;
  onViewProfile: () => void;
  onEdit: () => void;
  onAddTags: () => void;
  onDelete: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={labels.accessibility.openActions}
          onClick={(event) => event.stopPropagation()}
        >
          <TbDots className="size-4" aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        onClick={(event) => event.stopPropagation()}
      >
        <DropdownMenuItem onClick={onViewProfile}>
          <TbEye className="size-4" aria-hidden />
          {labels.actions.viewProfile}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onEdit}>
          <TbPencil className="size-4" aria-hidden />
          {labels.actions.edit}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onAddTags}>
          <TbTag className="size-4" aria-hidden />
          {labels.actions.addTag}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={onDelete}>
          <TbTrash className="size-4" aria-hidden />
          {labels.actions.delete}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function CustomersTable({
  labels,
  segmentLabels,
  customers,
  selectedCustomerIds,
  onSelectedCustomerIdsChange,
  onSelectCustomer,
  onEditCustomer,
  onAddTags,
  onDeleteCustomer,
  onImportCustomers,
  onPrefetchCustomer,
}: CustomersTableProps) {
  const customerIds = customers.map((customer) => customer.id);
  const pageCheckState = getPageCheckState(customerIds, selectedCustomerIds);

  const toggleCustomer = (customerId: string, checked: boolean) => {
    const next = new Set(selectedCustomerIds);

    if (checked) {
      next.add(customerId);
    } else {
      next.delete(customerId);
    }

    onSelectedCustomerIdsChange(next);
  };

  const toggleAllOnPage = (checked: boolean) => {
    if (!checked) {
      const next = new Set(selectedCustomerIds);
      for (const customerId of customerIds) {
        next.delete(customerId);
      }
      onSelectedCustomerIdsChange(next);
      return;
    }

    onSelectedCustomerIdsChange(
      new Set([...selectedCustomerIds, ...customerIds]),
    );
  };

  if (customers.length === 0) {
    return (
      <CustomersEmptyState
        labels={labels.empty}
        onImportCustomers={onImportCustomers}
      />
    );
  }

  return (
    <>
      <div className="hidden overflow-hidden rounded-3xl border border-border/70 bg-card lg:block">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead className="w-10">
                <Checkbox
                  checked={pageCheckState}
                  onCheckedChange={(checked) =>
                    toggleAllOnPage(checked === true)
                  }
                  aria-label={labels.accessibility.selectAllCustomers}
                />
              </TableHead>
              <TableHead>{labels.table.customer}</TableHead>
              <TableHead>{labels.table.contact}</TableHead>
              <TableHead>{labels.table.segment}</TableHead>
              <TableHead>{labels.table.orders}</TableHead>
              <TableHead>{labels.table.totalSpend}</TableHead>
              <TableHead>{labels.table.averageTicket}</TableHead>
              <TableHead>{labels.table.lastVisit}</TableHead>
              <TableHead>{labels.table.channel}</TableHead>
              <TableHead className="text-right">
                {labels.table.actions}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers.map((customer) => (
              <TableRow
                key={customer.id}
                className="cursor-pointer"
                tabIndex={0}
                data-state={
                  selectedCustomerIds.has(customer.id) ? "selected" : undefined
                }
                onClick={() => onSelectCustomer(customer)}
                onMouseEnter={() => onPrefetchCustomer?.(customer.id)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    onSelectCustomer(customer);
                  }
                }}
              >
                <TableCell>
                  <Checkbox
                    checked={selectedCustomerIds.has(customer.id)}
                    onCheckedChange={(checked) =>
                      toggleCustomer(customer.id, checked === true)
                    }
                    onClick={stopRowActivation}
                    onPointerDown={stopRowActivation}
                    aria-label={labels.accessibility.selectCustomer.replace(
                      "{name}",
                      customer.name,
                    )}
                  />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar size="sm">
                      {customer.avatar ? (
                        <AvatarImage
                          src={customer.avatar}
                          alt={customer.name}
                        />
                      ) : null}
                      <AvatarFallback>{customer.initials}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{customer.name}</p>
                      {customer.tags.length > 0 ? (
                        <p className="text-xs text-muted-foreground">
                          {customer.tags
                            .slice(0, 2)
                            .map((tag) => tag.name)
                            .join(" · ")}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <p className="text-sm">{customer.phone ?? "—"}</p>
                    <p className="text-xs text-muted-foreground">
                      {customer.email ?? "—"}
                    </p>
                  </div>
                </TableCell>
                <TableCell>
                  <CustomerSegmentBadge
                    segment={customer.segment}
                    labels={segmentLabels}
                  />
                </TableCell>
                <TableCell>{customer.orderCount}</TableCell>
                <TableCell className="font-medium">
                  {customer.totalSpend}
                </TableCell>
                <TableCell>{customer.averageTicket}</TableCell>
                <TableCell>{customer.lastVisitRelative}</TableCell>
                <TableCell>
                  <CustomerChannelBadge
                    channel={customer.primaryChannel}
                    labels={labels.channels}
                  />
                </TableCell>
                <TableCell className="text-right">
                  <CustomerActions
                    labels={labels}
                    onViewProfile={() => onSelectCustomer(customer)}
                    onEdit={() => onEditCustomer(customer)}
                    onAddTags={() => onAddTags(customer)}
                    onDelete={() => onDeleteCustomer(customer)}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="grid gap-3 lg:hidden">
        {customers.map((customer) => (
          <div
            key={customer.id}
            className="cursor-pointer rounded-3xl border border-border/70 bg-card p-4 shadow-sm transition hover:bg-muted/30"
            tabIndex={0}
            onClick={() => onSelectCustomer(customer)}
            onMouseEnter={() => onPrefetchCustomer?.(customer.id)}
            onFocus={() => onPrefetchCustomer?.(customer.id)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                onSelectCustomer(customer);
              }
            }}
          >
            <div className="flex items-start gap-3">
              <Checkbox
                checked={selectedCustomerIds.has(customer.id)}
                onCheckedChange={(checked) =>
                  toggleCustomer(customer.id, checked === true)
                }
                onClick={stopRowActivation}
                onPointerDown={stopRowActivation}
                aria-label={labels.accessibility.selectCustomer.replace(
                  "{name}",
                  customer.name,
                )}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-start gap-3">
                  <Avatar>
                    {customer.avatar ? (
                      <AvatarImage src={customer.avatar} alt={customer.name} />
                    ) : null}
                    <AvatarFallback>{customer.initials}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium">{customer.name}</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {customer.phone ?? customer.email ?? "—"}
                        </p>
                      </div>
                      <p className="text-sm font-semibold">
                        {customer.totalSpend}
                      </p>
                    </div>
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <CustomerSegmentBadge
                        segment={customer.segment}
                        labels={segmentLabels}
                      />
                      <CustomerChannelBadge
                        channel={customer.primaryChannel}
                        labels={labels.channels}
                      />
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                      <span>
                        {labels.table.orders}: {customer.orderCount}
                      </span>
                      <span>{customer.lastVisitRelative}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
