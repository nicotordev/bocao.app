import Link from "next/link";
import { TbArrowRight, TbReceipt } from "react-icons/tb";
import { getTranslations } from "next-intl/server";
import {
  RecentOrderItem,
  type RecentOrderItemLabels,
} from "@/components/dashboard/recent-order-item";
import type { DashboardOrderPreview } from "@/lib/dashboard/data";
import type { OrdersLabels } from "@/components/dashboard/orders/types";
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

type RecentOrdersListProps = {
  orders: DashboardOrderPreview[];
};

export async function RecentOrdersList({ orders }: RecentOrdersListProps) {
  const t = await getTranslations("dashboard.home.recentOrders");
  const tOrders = await getTranslations("dashboard.orders");

  const labels: RecentOrderItemLabels & {
    title: string;
    description: string;
    viewAll: string;
    empty: {
      title: string;
      description: string;
      cta: string;
    };
  } = {
    title: t("title"),
    description: t("description"),
    viewAll: t("viewAll"),
    viewOrder: t.raw("viewOrder"),
    table: t.raw("table"),
    statuses: {
      draft: tOrders("statuses.draft"),
      received: tOrders("statuses.received"),
      confirmed: tOrders("statuses.confirmed"),
      preparing: tOrders("statuses.preparing"),
      ready: tOrders("statuses.ready"),
      delivered: tOrders("statuses.delivered"),
      cancelled: tOrders("statuses.cancelled"),
      all: tOrders("statuses.all"),
    } satisfies OrdersLabels["statuses"],
    channels: {
      whatsapp: tOrders("channels.whatsapp"),
      web: tOrders("channels.web"),
      dineIn: tOrders("channels.dineIn"),
      uberEats: tOrders("channels.uberEats"),
      rappi: tOrders("channels.rappi"),
      pos: tOrders("channels.pos"),
      all: tOrders("channels.all"),
    } satisfies OrdersLabels["channels"],
    whatsappOrder: tOrders("accessibility.whatsappOrder"),
    empty: {
      title: t("empty.title"),
      description: t("empty.description"),
      cta: t("empty.cta"),
    },
  };

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
