import { Plus, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

type ReservationsHeaderProps = {
  labels: any;
  onNew: () => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
};

export function ReservationsHeader({
  labels,
  onNew,
  onRefresh,
  isRefreshing = false,
}: ReservationsHeaderProps) {
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
        <Button className="gap-2" onClick={onNew}>
          <Plus className="size-4" aria-hidden />
          {labels.actions.newReservation}
        </Button>
        {onRefresh && (
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
        )}
      </div>
    </section>
  );
}
