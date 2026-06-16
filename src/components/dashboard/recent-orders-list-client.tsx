"use client";

import Link from "next/link";
import { TbArrowRight, TbReceipt } from "react-icons/tb";
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
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

export type RecentOrdersListLabels = RecentOrderItemLabels & {
  title: string;
  description: string;
  viewAll: string;
  relativeMinutes: string;
  empty: {
    title: string;
    description: string;
    cta: string;
  };
};

type RecentOrdersListClientProps = {
  initialOrders: DashboardOrderPreview[];
  labels: RecentOrdersListLabels;
};

export function RecentOrdersListClient({
  initialOrders,
  labels,
}: RecentOrdersListClientProps) {
  const orders = initialOrders;

  return (
    <Card className="flex h-full flex-col border-border/60">
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
      <CardContent className="flex-1">
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
            <EmptyContent>
              <Button asChild>
                <Link href="/dashboard/orders/new">{labels.empty.cta}</Link>
              </Button>
            </EmptyContent>
          </Empty>
        ) : (
          <ul className="space-y-3">
            {orders.map((order) => (
              <RecentOrderItem key={order.id} order={order} labels={labels} />
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
