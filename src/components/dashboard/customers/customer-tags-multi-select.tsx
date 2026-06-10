"use client";

import { TbPlus } from "react-icons/tb";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  useComboboxAnchor,
} from "@/components/ui/combobox";
import type { CustomerTagSummary } from "@/lib/customers/tags.types";
import { CustomerTagBadge } from "./customer-tag-badge";
import {
  CreateTagDialog,
  type CreateTagDialogLabels,
} from "./create-tag-dialog";

export type CustomerTagsMultiSelectLabels = {
  label: string;
  optionalLabel?: string;
  searchPlaceholder: string;
  noResults: string;
  createTag: string;
  createTagDialog: CreateTagDialogLabels;
};

type CustomerTagsMultiSelectProps = {
  labels: CustomerTagsMultiSelectLabels;
  tags: CustomerTagSummary[];
  value: string[];
  onChange: (tagIds: string[]) => void;
  onCreateTag: (input: {
    name: string;
    color: string;
  }) => Promise<CustomerTagSummary>;
  isCreatingTag?: boolean;
  disabled?: boolean;
};

export function CustomerTagsMultiSelect({
  labels,
  tags,
  value,
  onChange,
  onCreateTag,
  isCreatingTag = false,
  disabled = false,
}: CustomerTagsMultiSelectProps) {
  const anchorRef = useComboboxAnchor();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const tagsById = useMemo(
    () => new Map(tags.map((tag) => [tag.id, tag])),
    [tags],
  );

  const selectedTags = useMemo(
    () =>
      value
        .map((tagId) => tagsById.get(tagId))
        .filter((tag): tag is CustomerTagSummary => Boolean(tag)),
    [tagsById, value],
  );

  async function handleCreateTag(input: { name: string; color: string }) {
    const tag = await onCreateTag(input);
    onChange([...new Set([...value, tag.id])]);
    return tag;
  }

  return (
    <Field>
      <div className="flex items-center justify-between gap-3">
        <FieldLabel>
          {labels.label}
          {labels.optionalLabel ? (
            <span className="text-xs font-normal text-muted-foreground">
              {" "}
              ({labels.optionalLabel})
            </span>
          ) : null}
        </FieldLabel>
        {!disabled ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 rounded-full px-2"
            onClick={() => setCreateDialogOpen(true)}
          >
            <TbPlus className="mr-1 size-4" aria-hidden />
            {labels.createTag}
          </Button>
        ) : null}
      </div>

      <Combobox
        multiple
        items={tags}
        value={selectedTags}
        onValueChange={(nextValue) => {
          onChange((nextValue ?? []).map((tag) => tag.id));
        }}
        itemToStringLabel={(tag) => tag.name}
        isItemEqualToValue={(item, selected) => item.id === selected.id}
        disabled={disabled}
      >
        <ComboboxChips ref={anchorRef} className="w-full rounded-3xl">
          {selectedTags.map((tag) => (
            <ComboboxChip key={tag.id} aria-label={tag.name}>
              <CustomerTagBadge tag={tag} />
            </ComboboxChip>
          ))}
          <ComboboxChipsInput
            placeholder={labels.searchPlaceholder}
            disabled={disabled}
          />
        </ComboboxChips>
        <ComboboxContent anchor={anchorRef}>
          <ComboboxEmpty>{labels.noResults}</ComboboxEmpty>
          <ComboboxList>
            {(tag) => (
              <ComboboxItem key={tag.id} value={tag}>
                <CustomerTagBadge tag={tag} />
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>

      <CreateTagDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        labels={labels.createTagDialog}
        isPending={isCreatingTag}
        onCreate={handleCreateTag}
      />
    </Field>
  );
}
