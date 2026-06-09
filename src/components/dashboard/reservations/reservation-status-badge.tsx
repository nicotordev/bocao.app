import type { ReservationStatus } from "@/lib/reservations/types";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const statusStyles: Record<ReservationStatus, string> = {
  PENDING:
    "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  CONFIRMED:
    "border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-400",
  SEATED:
    "border-purple-500/30 bg-purple-500/10 text-purple-700 dark:text-purple-400",
  COMPLETED:
    "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  CANCELLED: "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-400",
  NO_SHOW: "border-zinc-500/30 bg-zinc-500/10 text-zinc-600 dark:text-zinc-400",
};

type ReservationStatusBadgeProps = {
  status: ReservationStatus;
  label: string;
  className?: string;
};

export function ReservationStatusBadge({
  status,
  label,
  className,
}: ReservationStatusBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(
        statusStyles[status],
        "rounded-full px-2.5 py-0.5 text-[11px] font-medium capitalize shadow-sm",
        className,
      )}
    >
      {label}
    </Badge>
  );
}
