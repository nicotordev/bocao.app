import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { KitchenLabels } from "./types";

type KitchenCopilotCardProps = {
  labels: KitchenLabels["copilot"];
  actionLabel: string;
  items: readonly string[];
};

export function KitchenCopilotCard({
  labels,
  actionLabel,
  items,
}: KitchenCopilotCardProps) {
  return (
    <Card className="border-primary/20 bg-card/90">
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">
            <Sparkles className="size-4" aria-hidden />
          </span>
          <div>
            <CardTitle className="text-base">{labels.title}</CardTitle>
            <CardDescription>{labels.subtitle}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <ul className="space-y-2">
          {items.map((item) => (
            <li
              key={item}
              className="rounded-2xl border border-border/60 bg-background/60 px-3 py-2.5 text-sm leading-relaxed"
            >
              {item}
            </li>
          ))}
        </ul>
        <Button variant="secondary" className="w-full">
          {actionLabel}
        </Button>
      </CardContent>
    </Card>
  );
}
