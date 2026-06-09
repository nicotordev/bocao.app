"use client";

import {
  Archive,
  Edit3,
  Eye,
  Megaphone,
  MoreHorizontal,
  Tag,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
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
import { toast } from "sonner";
import type { CustomerListItem } from "@/lib/customers/types";
import { CustomerChannelBadge } from "./customer-channel-badge";
import { CustomerSegmentBadge } from "./customer-segment-badge";
import { CustomersEmptyState } from "./customers-empty-state";
import type { CustomerSegmentLabelMap, CustomersLabels } from "./types";

type CustomersTableProps = {
  labels: CustomersLabels;
  segmentLabels: CustomerSegmentLabelMap;
  customers: CustomerListItem[];
  onSelectCustomer: (customer: CustomerListItem) => void;
};

function CustomerActions({
  labels,
  onViewProfile,
}: {
  labels: CustomersLabels;
  onViewProfile: () => void;
}) {
  const showComingSoon = () => {
    toast.message(labels.actions.comingSoon);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={labels.accessibility.openActions}
          onClick={(event) => event.stopPropagation()}
        >
          <MoreHorizontal className="size-4" aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" onClick={(event) => event.stopPropagation()}>
        <DropdownMenuItem onClick={onViewProfile}>
          <Eye className="size-4" aria-hidden />
          {labels.actions.viewProfile}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={showComingSoon}>
          <Edit3 className="size-4" aria-hidden />
          {labels.actions.edit}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={showComingSoon}>
          <Megaphone className="size-4" aria-hidden />
          {labels.actions.createCampaign}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={showComingSoon}>
          <Tag className="size-4" aria-hidden />
          {labels.actions.addTag}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={showComingSoon}>
          <Archive className="size-4" aria-hidden />
          {labels.actions.archive}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function CustomersTable({
  labels,
  segmentLabels,
  customers,
  onSelectCustomer,
}: CustomersTableProps) {
  if (customers.length === 0) {
    return (
      <CustomersEmptyState
        labels={labels.empty}
        comingSoonLabel={labels.actions.comingSoon}
      />
    );
  }

  return (
    <>
      <div className="hidden overflow-hidden rounded-3xl border border-border/70 bg-card lg:block">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead>{labels.table.customer}</TableHead>
              <TableHead>{labels.table.contact}</TableHead>
              <TableHead>{labels.table.segment}</TableHead>
              <TableHead>{labels.table.orders}</TableHead>
              <TableHead>{labels.table.totalSpend}</TableHead>
              <TableHead>{labels.table.averageTicket}</TableHead>
              <TableHead>{labels.table.lastVisit}</TableHead>
              <TableHead>{labels.table.channel}</TableHead>
              <TableHead className="text-right">{labels.table.actions}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers.map((customer) => (
              <TableRow
                key={customer.id}
                className="cursor-pointer"
                tabIndex={0}
                onClick={() => onSelectCustomer(customer)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    onSelectCustomer(customer);
                  }
                }}
              >
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar size="sm">
                      {customer.avatar ? (
                        <AvatarImage src={customer.avatar} alt={customer.name} />
                      ) : null}
                      <AvatarFallback>{customer.initials}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{customer.name}</p>
                      {customer.tags.length > 0 ? (
                        <p className="text-xs text-muted-foreground">
                          {customer.tags.slice(0, 2).join(" · ")}
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
                <TableCell className="font-medium">{customer.totalSpend}</TableCell>
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
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="grid gap-3 lg:hidden">
        {customers.map((customer) => (
          <button
            key={customer.id}
            type="button"
            onClick={() => onSelectCustomer(customer)}
            className="rounded-3xl border border-border/70 bg-card p-4 text-left shadow-sm transition hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
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
                  <p className="text-sm font-semibold">{customer.totalSpend}</p>
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
          </button>
        ))}
      </div>
    </>
  );
}
