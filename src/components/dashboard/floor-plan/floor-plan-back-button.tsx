"use client";

import Link from "next/link";
import { TbArrowLeft } from "react-icons/tb";
import { Button } from "@/components/ui/button";

type FloorPlanBackButtonProps = {
  label: string;
};

export function FloorPlanBackButton({ label }: FloorPlanBackButtonProps) {
  return (
    <Button
      type="button"
      variant="secondary"
      size="icon-sm"
      aria-label={label}
      asChild
    >
      <Link href="/dashboard">
        <TbArrowLeft className="size-4" aria-hidden />
      </Link>
    </Button>
  );
}
