import { IconSparkles } from "@tabler/icons-react";
import type { DashboardInsight } from "@/lib/dashboard/data";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

type AiInsightsCardProps = {
  insights: DashboardInsight[];
};

const priorityLabels: Record<DashboardInsight["priority"], string> = {
  high: "Alta",
  medium: "Media",
  low: "Baja",
};

const priorityStyles: Record<DashboardInsight["priority"], string> = {
  high: "border-primary/30 bg-primary/10 text-primary",
  medium: "border-accent/30 bg-accent/10 text-accent-foreground",
  low: "text-muted-foreground",
};

export function AiInsightsCard({ insights }: AiInsightsCardProps) {
  return (
    <Card className="border-border/60 bg-gradient-to-br from-card via-card to-primary/5">
      <CardHeader>
        <div className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <IconSparkles className="size-4" aria-hidden />
          </span>
          <div>
            <CardTitle>Insights IA</CardTitle>
            <CardDescription>
              Recomendaciones en tiempo real para tu operación
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[280px] pr-3">
          <ul className="space-y-3">
            {insights.map((insight) => (
              <li
                key={insight.id}
                className="rounded-2xl border border-border/60 bg-background/40 p-4"
              >
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="text-sm font-medium">{insight.title}</p>
                  <Badge
                    variant="outline"
                    className={cn("shrink-0", priorityStyles[insight.priority])}
                  >
                    {priorityLabels[insight.priority]}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {insight.description}
                </p>
              </li>
            ))}
          </ul>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
