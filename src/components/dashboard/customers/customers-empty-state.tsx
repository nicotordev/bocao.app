import { TbUpload, TbUsers } from "react-icons/tb";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import type { CustomersLabels } from "./types";

type CustomersEmptyStateProps = {
  labels: CustomersLabels["empty"];
  onImportCustomers: () => void;
};

export function CustomersEmptyState({
  labels,
  onImportCustomers,
}: CustomersEmptyStateProps) {
  return (
    <Empty className="rounded-3xl border border-border/70 bg-card/80 py-16">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <TbUsers className="size-5" aria-hidden />
        </EmptyMedia>
        <EmptyTitle>{labels.title}</EmptyTitle>
        <EmptyDescription>{labels.description}</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button
          className="gap-2"
          onClick={onImportCustomers}
        >
          <TbUpload className="size-4" aria-hidden />
          {labels.cta}
        </Button>
      </EmptyContent>
    </Empty>
  );
}
