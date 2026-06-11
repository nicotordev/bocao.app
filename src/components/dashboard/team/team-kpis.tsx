import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { TeamSummary } from "@/lib/team/types";
import type { TeamLabels } from "./types";

type TeamKpisProps = {
  summary: TeamSummary;
  labels: TeamLabels["kpis"];
};

const kpiItems: Array<{
  key: keyof TeamSummary;
  labelKey: keyof TeamLabels["kpis"];
}> = [
  { key: "activeMembers", labelKey: "activeMembers" },
  { key: "pendingInvitations", labelKey: "pendingInvitations" },
  { key: "managers", labelKey: "managers" },
  { key: "kitchenStaff", labelKey: "kitchenStaff" },
  { key: "cashiers", labelKey: "cashiers" },
  { key: "inactiveMembers", labelKey: "inactiveMembers" },
];

export function TeamKpis({ summary, labels }: TeamKpisProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
      {kpiItems.map((item) => (
        <Card key={item.key} className="border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {labels[item.labelKey]}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold tracking-tight">
              {summary[item.key]}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
