import {
  TbSparkles,
} from "react-icons/tb";
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
  items?: string[];
};

export function AiOrderInsights({ labels, items = [] }: AiOrderInsightsProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <Card className="border-border/70 bg-card/80">
      <CardHeader className="pb-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <span className="grid size-8 shrink-0 place-items-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">
              <TbSparkles className="size-4" aria-hidden />
            </span>
            <div>
              <CardTitle className="text-base">{labels.title}</CardTitle>
              <CardDescription>{labels.subtitle}</CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <ul className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          {items.map((item) => (
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
