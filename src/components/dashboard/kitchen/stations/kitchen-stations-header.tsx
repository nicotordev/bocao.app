"use client";

import Link from "next/link";
import {
  TbArrowLeft,
  TbPlus,
} from "react-icons/tb";
import { Button } from "@/components/ui/button";
import type { KitchenStationsLabels } from "./types";

type KitchenStationsHeaderProps = {
  labels: KitchenStationsLabels["header"];
  onCreate: () => void;
  canEdit: boolean;
};

export function KitchenStationsHeader({
  labels,
  onCreate,
  canEdit,
}: KitchenStationsHeaderProps) {
  return (
    <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div className="max-w-2xl">
        <Button
          variant="ghost"
          size="sm"
          className="mb-3 -ml-2 gap-2 text-muted-foreground"
          asChild
        >
          <Link href="/dashboard/kitchen">
            <TbArrowLeft className="size-4" aria-hidden />
            {labels.backToKitchen}
          </Link>
        </Button>
        <h1 className="font-heading text-2xl font-semibold tracking-tight md:text-3xl">
          {labels.title}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground md:text-base">
          {labels.subtitle}
        </p>
      </div>
      {canEdit ? (
        <Button className="gap-2 self-start lg:self-auto" onClick={onCreate}>
          <TbPlus className="size-4" aria-hidden />
          {labels.createStation}
        </Button>
      ) : null}
    </section>
  );
}
