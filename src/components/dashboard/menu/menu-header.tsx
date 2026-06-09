import { Languages, Plus, RefreshCcw, Workflow } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { MenuPageLabels } from "./types";

type MenuHeaderProps = {
  labels: MenuPageLabels;
  canEdit: boolean;
  onNewItem: () => void;
  onNewCategory: () => void;
  onOpenFlowLibrary?: () => void;
  onOpenContentLocales?: () => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
};

export function MenuHeader({
  labels,
  canEdit,
  onNewItem,
  onNewCategory,
  onOpenFlowLibrary,
  onOpenContentLocales,
  onRefresh,
  isRefreshing = false,
}: MenuHeaderProps) {
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
      <div className="flex flex-wrap gap-2">
        {canEdit ? (
          <>
            {onOpenContentLocales ? (
              <Button
                variant="outline"
                className="gap-2"
                onClick={onOpenContentLocales}
              >
                <Languages className="size-4" aria-hidden />
                {labels.flow.contentLocales.open}
              </Button>
            ) : null}
            {onOpenFlowLibrary ? (
              <Button
                variant="outline"
                className="gap-2"
                onClick={onOpenFlowLibrary}
              >
                <Workflow className="size-4" aria-hidden />
                {labels.flow.actions.openLibrary}
              </Button>
            ) : null}
            <Button variant="outline" className="gap-2" onClick={onNewCategory}>
              <Plus className="size-4" aria-hidden />
              {labels.actions.newCategory}
            </Button>
            <Button className="gap-2" onClick={onNewItem}>
              <Plus className="size-4" aria-hidden />
              {labels.actions.newItem}
            </Button>
          </>
        ) : null}
        {onRefresh ? (
          <Button
            variant="outline"
            className="gap-2"
            onClick={onRefresh}
            disabled={isRefreshing}
          >
            <RefreshCcw
              className={isRefreshing ? "size-4 animate-spin" : "size-4"}
              aria-hidden
            />
            {labels.actions.refresh}
          </Button>
        ) : null}
      </div>
    </section>
  );
}
