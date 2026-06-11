"use client";

import Link from "next/link";
import { useState } from "react";
import { TbArrowRight, TbEye, TbReceipt } from "react-icons/tb";
import {
  RecentOrderItem,
  type RecentOrderItemLabels,
} from "@/components/dashboard/recent-order-item";
import type { DashboardOrderPreview } from "@/lib/dashboard/data";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

export type RecentOrdersListLabels = RecentOrderItemLabels & {
  title: string;
  description: string;
  viewAll: string;
  viewDetail: string;
  empty: {
    title: string;
    description: string;
  };
};

type RecentOrdersListClientProps = {
  orders: DashboardOrderPreview[];
  labels: RecentOrdersListLabels;
};

export function RecentOrdersListClient({
  orders,
  labels,
}: RecentOrdersListClientProps) {
  const [selectedId, setSelectedId] = useState<string | null>(
    orders[0]?.id ?? null,
  );

  const selectedOrder =
    orders.find((order) => order.id === selectedId) ?? orders[0] ?? null;

  return (
    <Card className="border-border/60">
      <CardHeader>
        <CardTitle>{labels.title}</CardTitle>
        <CardDescription>{labels.description}</CardDescription>
        <CardAction>
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/orders">
              {labels.viewAll}
              <TbArrowRight className="size-4" aria-hidden />
            </Link>
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        {orders.length === 0 ? (
          <Empty className="border border-dashed border-border/70 bg-muted/10 py-10">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <TbReceipt aria-hidden />
              </EmptyMedia>
              <EmptyTitle>{labels.empty.title}</EmptyTitle>
              <EmptyDescription className="max-w-sm">
                {labels.empty.description}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <ul role="listbox" aria-label={labels.title} className="space-y-3">
            {orders.map((order) => (
              <RecentOrderItem
                key={order.id}
                order={order}
                selected={selectedOrder?.id === order.id}
                onSelect={() => setSelectedId(order.id)}
                labels={labels}
              />
            ))}
          </ul>
        )}
      </CardContent>
      {selectedOrder ? (
        <CardFooter className="justify-end border-t border-border/50">
          <Button asChild className="gap-2">
            <Link
              href={`/dashboard/orders?orderId=${encodeURIComponent(selectedOrder.orderNumber)}`}
            >
              <TbEye className="size-4" aria-hidden />
              {labels.viewDetail}
            </Link>
          </Button>
        </CardFooter>
      ) : null}
    </Card>
  );
}
