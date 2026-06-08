"use client";

import type { CSSProperties } from "react";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import Image from "next/image";
import { cn } from "@/lib/utils";

export const FLOOR_PLAN_TABLE_PALETTE_ID = "floor-plan-table-palette";

type FloorPlanTablePaletteProps = {
  label: string;
  disabled?: boolean;
};

function TablePaletteButton({
  label,
  disabled = false,
  className,
  style,
  setNodeRef,
  dragProps,
}: {
  label: string;
  disabled?: boolean;
  className?: string;
  style?: CSSProperties;
  setNodeRef?: (node: HTMLButtonElement | null) => void;
  dragProps?: {
    listeners?: ReturnType<typeof useDraggable>["listeners"];
    attributes?: ReturnType<typeof useDraggable>["attributes"];
  };
}) {
  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <button
        ref={setNodeRef}
        type="button"
        style={style}
        data-floor-plan-table-palette
        aria-label={label}
        disabled={disabled}
        className={cn(
          "relative mx-auto flex size-20 touch-none items-center justify-center rounded-full bg-green-500 shadow-md ring-1 ring-green-600/20 transition-shadow",
          "cursor-grab active:cursor-grabbing hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
          disabled && "cursor-not-allowed opacity-50",
          className,
        )}
        {...dragProps?.listeners}
        {...dragProps?.attributes}
      >
        <Image
          src="/icons/table-round.svg"
          alt=""
          width={44}
          height={44}
          aria-hidden
          className="pointer-events-none select-none"
        />
      </button>
    </div>
  );
}

export function FloorPlanTablePaletteStatic({
  label,
  disabled = false,
}: FloorPlanTablePaletteProps) {
  return <TablePaletteButton label={label} disabled={disabled} />;
}

export function FloorPlanTablePalette({
  label,
  disabled = false,
}: FloorPlanTablePaletteProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: FLOOR_PLAN_TABLE_PALETTE_ID,
      disabled,
    });

  const style = transform
    ? {
        transform: CSS.Translate.toString(transform),
      }
    : undefined;

  return (
    <TablePaletteButton
      label={label}
      disabled={disabled}
      style={style}
      setNodeRef={setNodeRef}
      dragProps={{ attributes, listeners }}
      className={isDragging ? "opacity-35" : undefined}
    />
  );
}

export function FloorPlanTablePaletteOverlay() {
  return (
    <div className="flex size-20 items-center justify-center rounded-full bg-green-500 shadow-xl ring-1 ring-green-600/20">
      <Image
        src="/icons/table-round.svg"
        alt=""
        width={44}
        height={44}
        aria-hidden
        className="pointer-events-none select-none"
      />
    </div>
  );
}
