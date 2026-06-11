"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { TeamLabels } from "./types";

type TeamActivityCardProps = {
  labels: TeamLabels["activity"];
};

export function TeamActivityCard({ labels }: TeamActivityCardProps) {
  return (
    <Card className="border-border/60">
      <CardHeader>
        <CardTitle>{labels.title}</CardTitle>
        <CardDescription>{labels.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="rounded-xl border border-dashed border-border/70 bg-muted/10 px-4 py-6 text-sm text-muted-foreground">
          {labels.comingSoon}
        </p>
      </CardContent>
    </Card>
  );
}
