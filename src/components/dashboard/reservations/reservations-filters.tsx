import { TbX } from "react-icons/tb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import type { ReservationsPageLabels } from "@/lib/reservations/page-labels";

type ReservationsFiltersProps = {
  labels: ReservationsPageLabels;
  search: string;
  onSearchChange: (value: string) => void;
  status: string;
  onStatusChange: (value: string) => void;
  date: Date | undefined;
  onDateChange: (value: Date | undefined) => void;
  onClear: () => void;
};

const statusOptions = [
  "all",
  "PENDING",
  "CONFIRMED",
  "SEATED",
  "COMPLETED",
  "CANCELLED",
  "NO_SHOW",
];

export function ReservationsFilters({
  labels,
  search,
  onSearchChange,
  status,
  onStatusChange,
  date,
  onDateChange,
  onClear,
}: ReservationsFiltersProps) {
  const hasActiveFilters =
    search.length > 0 || status !== "all" || date !== undefined;

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (!val) {
      onDateChange(undefined);
    } else {
      onDateChange(new Date(val + "T00:00:00"));
    }
  };

  const dateValueString = date ? format(date, "yyyy-MM-dd") : "";

  return (
    <section className="sticky top-14 z-20 overflow-visible rounded-3xl border border-border/70 bg-background/90 p-3 shadow-sm backdrop-blur md:top-16">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          aria-label={labels.filters.search}
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={labels.filters.searchPlaceholder}
          className="h-10 flex-1 rounded-2xl bg-input/50"
        />

        <div className="flex flex-wrap items-center gap-2">
          <Select value={status} onValueChange={onStatusChange}>
            <SelectTrigger className="h-10 w-[160px] rounded-2xl bg-input/50 text-sm">
              <SelectValue placeholder={labels.filters.status} />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((opt) => (
                <SelectItem key={opt} value={opt}>
                  {opt === "all"
                    ? labels.statuses.all
                    : labels.statuses[
                        opt as Exclude<
                          keyof ReservationsPageLabels["statuses"],
                          "all"
                        >
                      ]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="relative">
            <Input
              type="date"
              aria-label={labels.filters.date}
              value={dateValueString}
              onChange={handleDateChange}
              className="h-10 rounded-2xl bg-input/50 px-3 py-1 text-sm w-[150px]"
            />
          </div>

          {hasActiveFilters && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClear}
              className="h-10 rounded-2xl gap-1.5 px-3 text-muted-foreground hover:text-foreground"
            >
              <TbX className="size-4" aria-hidden />
              {labels.actions.clearFilters}
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}
