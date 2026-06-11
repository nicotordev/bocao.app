import { Badge } from "@/components/ui/badge";
import type { TeamRole } from "@/lib/team/permissions";
import { cn } from "@/lib/utils";

const roleVariants: Record<TeamRole | "staff", string> = {
  owner: "border-amber-500/40 bg-amber-500/10 text-amber-200",
  admin: "border-violet-500/40 bg-violet-500/10 text-violet-200",
  manager: "border-sky-500/40 bg-sky-500/10 text-sky-200",
  cashier: "border-emerald-500/40 bg-emerald-500/10 text-emerald-200",
  kitchen: "border-orange-500/40 bg-orange-500/10 text-orange-200",
  waiter: "border-cyan-500/40 bg-cyan-500/10 text-cyan-200",
  marketing: "border-pink-500/40 bg-pink-500/10 text-pink-200",
  viewer: "border-border bg-muted/40 text-muted-foreground",
  staff: "border-cyan-500/40 bg-cyan-500/10 text-cyan-200",
};

type TeamRoleBadgeProps = {
  role: TeamRole | "staff";
  label: string;
};

export function TeamRoleBadge({ role, label }: TeamRoleBadgeProps) {
  return (
    <Badge variant="outline" className={cn("font-medium", roleVariants[role])}>
      {label}
    </Badge>
  );
}
