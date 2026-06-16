import { TbFolderPlus } from "react-icons/tb";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import type { MenuPageLabels } from "./types";

type MenuEmptyStateProps = {
  labels: MenuPageLabels["empty"];
  canEdit: boolean;
  onCreateCategory: () => void;
};

export function MenuEmptyState({
  labels,
  canEdit,
  onCreateCategory,
}: MenuEmptyStateProps) {
  return (
    <Empty className="rounded-3xl border border-border/70 bg-card/80 py-16">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <TbFolderPlus className="size-5" aria-hidden />
        </EmptyMedia>
        <EmptyTitle>{labels.title}</EmptyTitle>
        <EmptyDescription>{labels.description}</EmptyDescription>
      </EmptyHeader>
      {canEdit ? (
        <EmptyContent>
          <Button className="rounded-2xl" onClick={onCreateCategory}>
            {labels.categoryCta}
          </Button>
        </EmptyContent>
      ) : null}
    </Empty>
  );
}
