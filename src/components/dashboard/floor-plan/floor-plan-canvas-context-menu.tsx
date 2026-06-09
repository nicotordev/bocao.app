"use client";

import {
  IconArrowDown,
  IconArrowUp,
  IconPlus,
  IconTable,
  IconTrash,
} from "@tabler/icons-react";
import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

export type FloorPlanCanvasContextMenuLabels = {
  addTable: string;
  floorUp: string;
  floorDown: string;
  tablesModeHint: string;
  activateTablesMode: string;
  removeVertex: string;
  closeMenu: string;
};

type FloorPlanCanvasContextMenuProps = {
  children: ReactNode;
  labels: FloorPlanCanvasContextMenuLabels;
  enabled?: boolean;
  elevated?: boolean;
  tablesModeActive?: boolean;
  boundaryModeActive?: boolean;
  canRemoveVertex?: boolean;
  canFloorUp?: boolean;
  canFloorDown?: boolean;
  onCanvasRef?: (node: HTMLDivElement | null) => void;
  onAddTable: (clientX: number, clientY: number) => void;
  onActivateTablesMode: () => void;
  onRemoveVertex?: () => void;
  onFloorUp: () => void;
  onFloorDown: () => void;
};

type MenuItemProps = {
  children: ReactNode;
  disabled?: boolean;
  onSelect: () => void;
};

function ContextMenuButton({
  children,
  disabled = false,
  onSelect,
}: MenuItemProps) {
  return (
    <button
      type="button"
      role="menuitem"
      disabled={disabled}
      className={cn(
        "flex w-full cursor-default items-center gap-2.5 rounded-2xl px-3 py-2 text-left text-sm font-medium outline-hidden transition-colors",
        "hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
        "disabled:pointer-events-none disabled:opacity-50",
        "[&_svg]:size-4 [&_svg]:shrink-0",
      )}
      onClick={onSelect}
    >
      {children}
    </button>
  );
}

export function FloorPlanCanvasContextMenu({
  children,
  labels,
  enabled = true,
  elevated = false,
  tablesModeActive = true,
  boundaryModeActive = false,
  canRemoveVertex = false,
  canFloorUp = false,
  canFloorDown = false,
  onCanvasRef,
  onAddTable,
  onActivateTablesMode,
  onRemoveVertex,
  onFloorUp,
  onFloorDown,
}: FloorPlanCanvasContextMenuProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const contextPointRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    function handleDismiss() {
      setOpen(false);
    }

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("scroll", handleDismiss, true);
    window.addEventListener("resize", handleDismiss);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("scroll", handleDismiss, true);
      window.removeEventListener("resize", handleDismiss);
    };
  }, [open]);

  function closeMenu() {
    setOpen(false);
  }

  function handleContextMenu(event: React.MouseEvent<HTMLDivElement>) {
    if (!enabled) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    contextPointRef.current = {
      x: event.clientX,
      y: event.clientY,
    };
    setOpen(true);
  }

  return (
    <>
      <div
        ref={onCanvasRef}
        className="block h-full w-full min-h-0"
        onContextMenuCapture={handleContextMenu}
      >
        {children}
      </div>
      {enabled && open && mounted
        ? createPortal(
            <>
              <button
                type="button"
                aria-label={labels.closeMenu}
                className="fixed inset-0 z-[99] cursor-default bg-transparent"
                onClick={closeMenu}
                onContextMenu={(event) => {
                  event.preventDefault();
                  closeMenu();
                }}
              />
              <div
                role="menu"
                className={cn(
                  "fixed z-[100] min-w-48 origin-top-left overflow-hidden rounded-3xl bg-popover p-1.5 text-popover-foreground shadow-lg ring-1 ring-foreground/5 dark:ring-foreground/10",
                  elevated && "z-[100]",
                )}
                style={{
                  left: contextPointRef.current.x,
                  top: contextPointRef.current.y,
                }}
              >
                {!tablesModeActive ? (
                  <>
                    <p className="px-3 py-2.5 text-xs text-muted-foreground">
                      {labels.tablesModeHint}
                    </p>
                    <ContextMenuButton
                      onSelect={() => {
                        onActivateTablesMode();
                        closeMenu();
                      }}
                    >
                      <IconTable />
                      {labels.activateTablesMode}
                    </ContextMenuButton>
                    <div className="-mx-1.5 my-1.5 h-px bg-border/50" />
                  </>
                ) : (
                  <ContextMenuButton
                    onSelect={() => {
                      const { x, y } = contextPointRef.current;
                      onAddTable(x, y);
                      closeMenu();
                    }}
                  >
                    <IconPlus />
                    {labels.addTable}
                  </ContextMenuButton>
                )}
                {boundaryModeActive && canRemoveVertex && onRemoveVertex ? (
                  <ContextMenuButton
                    onSelect={() => {
                      onRemoveVertex();
                      closeMenu();
                    }}
                  >
                    <IconTrash />
                    {labels.removeVertex}
                  </ContextMenuButton>
                ) : null}
                <div className="-mx-1.5 my-1.5 h-px bg-border/50" />
                <ContextMenuButton
                  disabled={!canFloorUp}
                  onSelect={() => {
                    onFloorUp();
                    closeMenu();
                  }}
                >
                  <IconArrowUp />
                  {labels.floorUp}
                </ContextMenuButton>
                <ContextMenuButton
                  disabled={!canFloorDown}
                  onSelect={() => {
                    onFloorDown();
                    closeMenu();
                  }}
                >
                  <IconArrowDown />
                  {labels.floorDown}
                </ContextMenuButton>
              </div>
            </>,
            document.body,
          )
        : null}
    </>
  );
}
