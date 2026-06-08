import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import type { NewOrderLabels } from "./types";

type NewOrderHeaderProps = {
  labels: NewOrderLabels;
};

export function NewOrderHeader({ labels }: NewOrderHeaderProps) {
  return (
    <section className="flex flex-col gap-4">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard/orders">
              {labels.breadcrumb.orders}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{labels.breadcrumb.new}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <h1 className="font-heading text-2xl font-semibold tracking-tight md:text-3xl">
            {labels.header.title}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground md:text-base">
            {labels.header.subtitle}
          </p>
        </div>
        <Button variant="outline" className="gap-2 self-start" asChild>
          <Link href="/dashboard/orders">
            <ArrowLeft className="size-4" aria-hidden />
            {labels.actions.back}
          </Link>
        </Button>
      </div>
    </section>
  );
}
