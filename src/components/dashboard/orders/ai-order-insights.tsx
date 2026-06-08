import { Sparkles } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { OrdersLabels } from "./types";

type AiOrderInsightsProps = {
  labels: OrdersLabels["insights"];
};

export function AiOrderInsights({ labels }: AiOrderInsightsProps) {
  return (
    <Card className="border-border/70 bg-card/80">
      <CardHeader>
        <div className="flex items-center gap-2">
          <span className="grid size-8 place-items-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">
            <Sparkles className="size-4" aria-hidden />
          </span>
          <div>
            <CardTitle>{labels.title}</CardTitle>
            <CardDescription>{labels.subtitle}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {labels.items.map((item) => (
            <li
              key={item}
              className="rounded-2xl border border-border/60 bg-background/60 p-3 text-sm leading-relaxed"
            >
              {item}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
