"use client";

import { Plus, X } from "lucide-react";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type { MenuTagIconId } from "@/lib/menu/tag-icons";
import {
  createCustomMenuTag,
  normalizeMenuItemTags,
  resolveMenuTagLabel,
} from "@/lib/menu/tag-utils";
import {
  isMenuTagCatalogKey,
  MENU_TAG_CATALOG,
  type MenuItemTag,
} from "@/lib/menu/tag-types";
import { cn } from "@/lib/utils";
import { MenuTagIconGlyph, MenuTagIconPicker } from "./menu-tag-icon-picker";

export type MenuCatalogTagOption = {
  key: string;
  label: string;
  icon: MenuTagIconId;
};

export type MenuItemTagsFieldLabels = {
  label: string;
  catalog: string;
  customLabel: string;
  customPlaceholder: string;
  add: string;
  remove: string;
  suggestions: string;
  pickIcon: string;
};

type MenuItemTagsFieldProps = {
  labels: MenuItemTagsFieldLabels;
  catalogTags: MenuCatalogTagOption[];
  catalogLabels: Record<string, string>;
  value: MenuItemTag[];
  suggestions: MenuItemTag[];
  onChange: (tags: MenuItemTag[]) => void;
  disabled?: boolean;
};

function tagKey(tag: MenuItemTag) {
  return tag.key;
}

export function MenuItemTagsField({
  labels,
  catalogTags,
  catalogLabels,
  value,
  suggestions,
  onChange,
  disabled = false,
}: MenuItemTagsFieldProps) {
  const [customLabel, setCustomLabel] = useState("");
  const [customIcon, setCustomIcon] = useState<MenuTagIconId>("TbStar");

  const selectedKeys = useMemo(
    () => new Set(value.map((tag) => tag.key)),
    [value],
  );

  const customSuggestions = useMemo(() => {
    return suggestions.filter(
      (tag) =>
        !isMenuTagCatalogKey(tag.key) &&
        !selectedKeys.has(tag.key) &&
        tag.label,
    );
  }, [selectedKeys, suggestions]);

  function setTags(nextTags: MenuItemTag[]) {
    onChange(normalizeMenuItemTags(nextTags));
  }

  function toggleCatalogTag(key: string) {
    if (selectedKeys.has(key)) {
      setTags(value.filter((tag) => tag.key !== key));
      return;
    }

    if (!isMenuTagCatalogKey(key)) {
      return;
    }

    setTags([
      ...value,
      {
        key,
        icon: MENU_TAG_CATALOG[key].icon,
      },
    ]);
  }

  function removeTag(key: string) {
    setTags(value.filter((tag) => tag.key !== key));
  }

  function addCustomTag(label: string, icon?: MenuTagIconId) {
    const tag = createCustomMenuTag(label, icon);
    if (!tag || selectedKeys.has(tag.key)) {
      return;
    }

    setTags([...value, tag]);
    setCustomLabel("");
  }

  function handleSubmitCustom() {
    addCustomTag(customLabel, customIcon);
  }

  return (
    <Field>
      <FieldLabel>{labels.label}</FieldLabel>

      {value.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {value.map((tag) => (
            <Badge
              key={tagKey(tag)}
              variant="secondary"
              className="gap-1 rounded-full px-2.5 py-1 text-xs"
            >
              <MenuTagIconGlyph icon={tag.icon} className="size-3" />
              {resolveMenuTagLabel(tag, catalogLabels)}
              {!disabled ? (
                <button
                  type="button"
                  className="rounded-full p-0.5 hover:bg-background/70"
                  aria-label={`${labels.remove}: ${resolveMenuTagLabel(tag, catalogLabels)}`}
                  onClick={() => removeTag(tag.key)}
                >
                  <X className="size-3" aria-hidden />
                </button>
              ) : null}
            </Badge>
          ))}
        </div>
      ) : null}

      {!disabled ? (
        <div className="mt-4 space-y-4">
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">
              {labels.catalog}
            </p>
            <div className="flex flex-wrap gap-2">
              {catalogTags.map((option) => {
                const isSelected = selectedKeys.has(option.key);

                return (
                  <button
                    key={option.key}
                    type="button"
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                      isSelected
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-background hover:bg-muted",
                    )}
                    onClick={() => toggleCatalogTag(option.key)}
                  >
                    <MenuTagIconGlyph icon={option.icon} className="size-3.5" />
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-3 rounded-2xl border border-border p-3">
            <p className="text-xs font-medium text-muted-foreground">
              {labels.customLabel}
            </p>
            <Input
              value={customLabel}
              onChange={(event) => setCustomLabel(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  handleSubmitCustom();
                }
              }}
              placeholder={labels.customPlaceholder}
              className="rounded-3xl"
            />
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">{labels.pickIcon}</p>
              <MenuTagIconPicker
                value={customIcon}
                onChange={setCustomIcon}
              />
            </div>
            <Button
              type="button"
              variant="outline"
              className="rounded-3xl"
              onClick={handleSubmitCustom}
              disabled={!customLabel.trim()}
            >
              <Plus className="mr-1 size-4" aria-hidden />
              {labels.add}
            </Button>
          </div>

          {customSuggestions.length > 0 ? (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                {labels.suggestions}
              </p>
              <div className="flex flex-wrap gap-2">
                {customSuggestions.map((tag) => (
                  <button
                    key={tag.key}
                    type="button"
                    className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1 text-xs font-medium transition-colors hover:bg-muted"
                    onClick={() => addCustomTag(tag.label ?? tag.key, tag.icon)}
                  >
                    {tag.icon ? (
                      <MenuTagIconGlyph icon={tag.icon} className="size-3.5" />
                    ) : null}
                    {tag.label ?? tag.key}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </Field>
  );
}

export function MenuItemTagsPreview({
  tags,
  catalogLabels,
  className,
}: {
  tags: MenuItemTag[];
  catalogLabels: Record<string, string>;
  className?: string;
}) {
  if (tags.length === 0) {
    return null;
  }

  return (
    <div className={cn("flex flex-wrap gap-1.5", className)}>
      {tags.map((tag) => (
        <Badge
          key={tag.key}
          variant="outline"
          className="gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium"
        >
          <MenuTagIconGlyph icon={tag.icon} className="size-3" />
          {resolveMenuTagLabel(tag, catalogLabels)}
        </Badge>
      ))}
    </div>
  );
}
