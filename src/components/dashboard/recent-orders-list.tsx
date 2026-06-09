import { getTranslations } from "next-intl/server";
import type { DashboardOrderPreview } from "@/lib/dashboard/data";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type RecentOrdersListProps = {
  orders: DashboardOrderPreview[];
};

const statusVariants: Record<
  DashboardOrderPreview["status"],
  "default" | "secondary" | "outline" | "destructive"
> = {
  pending: "outline",
  preparing: "default",
  ready: "secondary",
  completed: "outline",
};

export async function RecentOrdersList({ orders }: RecentOrdersListProps) {
  const t = await getTranslations("dashboard.home.recentOrders");

  return (
    <Card className="border-border/60">
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {orders.map((order) => (
            <li
              key={order.id}
              className="flex items-center justify-between gap-3 rounded-2xl border border-border/50 bg-muted/20 px-4 py-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">
                  {order.orderNumber} · {order.customerName}
                </p>
                <p className="text-xs text-muted-foreground">
                  {order.createdAt}
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <span className="text-sm font-medium">{order.total}</span>
                <Badge
                  variant={statusVariants[order.status]}
                  className={cn(
                    order.status === "preparing" &&
                      "bg-primary/15 text-primary hover:bg-primary/20",
                  )}
                >
                  {t(`status.${order.status}`)}
                </Badge>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
