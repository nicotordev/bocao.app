"use client";

import {
  TbArchive,
  TbBookmark,
  TbSpeakerphone,
  TbTrash,
  TbX,
} from "react-icons/tb";
import { Button } from "@/components/ui/button";
import type { CustomersLabels } from "./types";

type CustomersBulkActionsBarProps = {
  labels: CustomersLabels["bulkActions"];
  selectedCount: number;
  onClearSelection: () => void;
  onExport: () => void;
  onCreateCampaign: () => void;
  onSaveToSegment: () => void;
  onArchive: () => void;
  onDelete: () => void;
};

export function CustomersBulkActionsBar({
  labels,
  selectedCount,
  onClearSelection,
  onExport,
  onCreateCampaign,
  onSaveToSegment,
  onArchive,
  onDelete,
}: CustomersBulkActionsBarProps) {
  if (selectedCount === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2">
        <p className="text-sm font-medium">
          {labels.selectedCount.replace("{count}", String(selectedCount))}
        </p>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onClearSelection}
        >
          <TbX className="size-4" aria-hidden />
          {labels.clearSelection}
        </Button>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="outline" size="sm" onClick={onExport}>
          {labels.export}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onCreateCampaign}
        >
          <TbSpeakerphone className="size-4" aria-hidden />
          {labels.createCampaign}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onSaveToSegment}
        >
          <TbBookmark className="size-4" aria-hidden />
          {labels.saveToSegment}
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={onArchive}>
          <TbArchive className="size-4" aria-hidden />
          {labels.archive}
        </Button>
        <Button
          type="button"
          variant="destructive"
          size="sm"
          onClick={onDelete}
        >
          <TbTrash className="size-4" aria-hidden />
          {labels.delete}
        </Button>
      </div>
    </div>
  );
}
