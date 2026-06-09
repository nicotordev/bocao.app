import { Upload, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { toast } from "sonner";
import type { CustomersLabels } from "./types";

type CustomersEmptyStateProps = {
  labels: CustomersLabels["empty"];
  comingSoonLabel: string;
};

export function CustomersEmptyState({
  labels,
  comingSoonLabel,
}: CustomersEmptyStateProps) {
  return (
    <Empty className="rounded-3xl border border-border/70 bg-card/80 py-16">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Users className="size-5" aria-hidden />
        </EmptyMedia>
        <EmptyTitle>{labels.title}</EmptyTitle>
        <EmptyDescription>{labels.description}</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button
          className="gap-2"
          onClick={() => {
            toast.message(comingSoonLabel);
          }}
        >
          <Upload className="size-4" aria-hidden />
          {labels.cta}
        </Button>
      </EmptyContent>
    </Empty>
  );
}
