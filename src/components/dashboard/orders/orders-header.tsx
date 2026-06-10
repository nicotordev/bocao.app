import Link from "next/link";
import {
  TbDownload,
  TbPlus,
  TbRefresh,
} from "react-icons/tb";
import { Button } from "@/components/ui/button";
import type { OrdersLabels } from "./types";

type OrdersHeaderProps = {
  labels: OrdersLabels;
  onExport?: () => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
};

export function OrdersHeader({
  labels,
  onExport,
  onRefresh,
  isRefreshing = false,
}: OrdersHeaderProps) {
  return (
    <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div className="max-w-2xl">
        <h1 className="font-heading text-2xl font-semibold tracking-tight md:text-3xl">
          {labels.header.title}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground md:text-base">
          {labels.header.subtitle}
        </p>
      </div>
      <div className="grid grid-cols-1 gap-2 min-[420px]:grid-cols-3 lg:flex">
        <Button className="gap-2" asChild>
          <Link href="/dashboard/orders/new">
            <TbPlus className="size-4" aria-hidden />
            {labels.actions.newOrder}
          </Link>
        </Button>
        <Button variant="secondary" className="gap-2" onClick={onExport}>
          <TbDownload className="size-4" aria-hidden />
          {labels.actions.export}
        </Button>
        <Button
          variant="outline"
          className="gap-2"
          onClick={onRefresh}
          disabled={isRefreshing}
        >
          <TbRefresh
            className={isRefreshing ? "size-4 animate-spin" : "size-4"}
            aria-hidden
          />
          {labels.actions.refresh}
        </Button>
      </div>
    </section>
  );
}
