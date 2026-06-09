"use client";

import Link from "next/link";
import {
  Copy,
  Edit3,
  Eye,
  MoreHorizontal,
  Printer,
  RefreshCcw,
  XCircle,
} from "lucide-react";
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
import { OrderChannelBadge } from "./order-channel-badge";
import { OrderStatusBadge } from "./order-status-badge";
import type { DashboardOrder, OrdersLabels } from "./types";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from "@/components/ui/empty";

type OrdersTableProps = {
  labels: OrdersLabels;
  orders: DashboardOrder[];
  onSelectOrder: (order: DashboardOrder) => void;
};

export function OrdersTable({
  labels,
  orders,
  onSelectOrder,
}: OrdersTableProps) {
  if (orders.length === 0) {
    return <OrdersEmptyState labels={labels} />;
  }

  return (
    <>
      <div className="hidden overflow-hidden rounded-3xl border border-border/70 bg-card lg:block">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead>{labels.table.id}</TableHead>
              <TableHead>{labels.table.customer}</TableHead>
              <TableHead>{labels.table.channel}</TableHead>
              <TableHead>{labels.table.status}</TableHead>
              <TableHead>{labels.table.total}</TableHead>
              <TableHead>{labels.table.time}</TableHead>
              <TableHead>{labels.table.wait}</TableHead>
              <TableHead>{labels.table.owner}</TableHead>
              <TableHead className="text-right">
                {labels.table.actions}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => (
              <TableRow
                key={order.id}
                className="cursor-pointer"
                tabIndex={0}
                onClick={() => onSelectOrder(order)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") onSelectOrder(order);
                }}
              >
                <TableCell className="font-medium">{order.id}</TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium">{order.customerName}</p>
                    <p className="text-xs text-muted-foreground">
                      {order.phone}
                    </p>
                  </div>
                </TableCell>
                <TableCell>
                  <OrderChannelBadge
                    channel={order.channel}
                    labels={labels.channels}
                    whatsappLabel={labels.accessibility.whatsappOrder}
                  />
                </TableCell>
                <TableCell>
                  <OrderStatusBadge
                    status={order.status}
                    labels={labels.statuses}
                  />
                </TableCell>
                <TableCell className="font-medium">{order.total}</TableCell>
                <TableCell>{order.createdAt}</TableCell>
                <TableCell>
                  {order.waitMinutes} {labels.table.minutes}
                </TableCell>
                <TableCell>{order.owner}</TableCell>
                <TableCell className="text-right">
                  <OrderActions
                    labels={labels}
                    onSelect={() => onSelectOrder(order)}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="grid gap-3 lg:hidden">
        {orders.map((order) => (
          <button
            key={order.id}
            type="button"
            onClick={() => onSelectOrder(order)}
            className="rounded-3xl border border-border/70 bg-card p-4 text-left shadow-sm transition hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium">{order.id}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {order.customerName}
                </p>
              </div>
              <p className="text-sm font-semibold">{order.total}</p>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <OrderStatusBadge
                status={order.status}
                labels={labels.statuses}
              />
              <OrderChannelBadge
                channel={order.channel}
                labels={labels.channels}
                whatsappLabel={labels.accessibility.whatsappOrder}
              />
              <span className="text-xs text-muted-foreground">
                {order.waitMinutes} {labels.table.minutes}
              </span>
            </div>
          </button>
        ))}
      </div>
    </>
  );
}

function OrderActions({
  labels,
  onSelect,
}: {
  labels: OrdersLabels;
  onSelect: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={labels.accessibility.openActions}
          onClick={(event) => event.stopPropagation()}
        >
          <MoreHorizontal className="size-4" aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        onClick={(event) => event.stopPropagation()}
      >
        <DropdownMenuItem onSelect={onSelect}>
          <Eye className="size-4" aria-hidden />
          {labels.actions.viewDetail}
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Edit3 className="size-4" aria-hidden />
          {labels.actions.edit}
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Printer className="size-4" aria-hidden />
          {labels.actions.print}
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Copy className="size-4" aria-hidden />
          {labels.actions.duplicate}
        </DropdownMenuItem>
        <DropdownMenuItem>
          <RefreshCcw className="size-4" aria-hidden />
          {labels.actions.changeStatus}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive">
          <XCircle className="size-4" aria-hidden />
          {labels.actions.cancel}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function OrdersEmptyState({ labels }: { labels: OrdersLabels }) {
  return (
    <Empty className="border border-dashed border-border/70 bg-card/50">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Eye className="size-7 text-muted-foreground" aria-hidden />
        </EmptyMedia>
        <EmptyTitle>{labels.empty.title}</EmptyTitle>
        <EmptyDescription>{labels.empty.description}</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button asChild>
          <Link href="/dashboard/orders/new">{labels.empty.cta}</Link>
        </Button>
      </EmptyContent>
    </Empty>
  );
}
