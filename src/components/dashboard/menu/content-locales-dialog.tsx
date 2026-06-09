"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { updateRestaurantContentLocalesAction } from "@/app/actions/restaurant";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ISO_LANGUAGE_CATALOG } from "@/i18n/iso-languages";
import type { MenuLocaleOption } from "./types";

type ContentLocalesDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  labels: {
    title: string;
    description: string;
    search: string;
    save: string;
    saving: string;
    cancel: string;
    success: string;
    error: string;
    minOne: string;
  };
  uiLocale: string;
  restaurantId: string;
  contentLocales: string[];
  onSaved: (locales: string[], localeOptions: MenuLocaleOption[]) => void;
};

export function ContentLocalesDialog({
  open,
  onOpenChange,
  labels,
  uiLocale,
  restaurantId,
  contentLocales,
  onSaved,
}: ContentLocalesDialogProps) {
  const [selected, setSelected] = useState<string[]>(contentLocales);
  const [search, setSearch] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const catalog = useMemo(() => {
    const query = search.trim().toLowerCase();

    return ISO_LANGUAGE_CATALOG.filter((language) => {
      if (!query) {
        return true;
      }

      return (
        language.code.includes(query) ||
        language.label.toLowerCase().includes(query) ||
        language.nativeLabel.toLowerCase().includes(query)
      );
    });
  }, [search]);

  function toggleLocale(code: string, enabled: boolean) {
    setSelected((current) => {
      if (enabled) {
        return [...new Set([...current, code])];
      }

      return current.filter((entry) => entry !== code);
    });
  }

  async function handleSave() {
    if (selected.length === 0) {
      toast.error(labels.minOne);
      return;
    }

    setIsSaving(true);

    try {
      const result = await updateRestaurantContentLocalesAction({
        restaurantId,
        contentLocales: selected,
        uiLocale,
      });
      onSaved(result.contentLocales, result.localeOptions);
      toast.success(labels.success);
      onOpenChange(false);
    } catch {
      toast.error(labels.error);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (nextOpen) {
          setSelected(contentLocales);
          setSearch("");
        }
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent className="flex h-[min(80vh,720px)] w-[min(96vw,40rem)] max-w-none flex-col gap-0 overflow-hidden p-0 sm:max-w-[min(96vw,40rem)]">
        <DialogHeader className="shrink-0 border-b border-border px-6 py-5">
          <DialogTitle>{labels.title}</DialogTitle>
          <DialogDescription>{labels.description}</DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto p-6">
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={labels.search}
            className="mb-4 rounded-2xl"
          />

          <div className="grid gap-2 sm:grid-cols-2">
            {catalog.map((language) => {
              const checked = selected.includes(language.code);
              const displayLabel = uiLocale.startsWith("en")
                ? language.label
                : language.nativeLabel;

              return (
                <label
                  key={language.code}
                  className="flex items-center gap-3 rounded-2xl border border-border px-3 py-2 text-sm"
                >
                  <Checkbox
                    checked={checked}
                    onCheckedChange={(nextChecked) =>
                      toggleLocale(language.code, nextChecked === true)
                    }
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium">{displayLabel}</span>
                    <span className="text-xs text-muted-foreground">
                      {language.code.toUpperCase()}
                    </span>
                  </span>
                </label>
              );
            })}
          </div>
        </div>

        <DialogFooter className="shrink-0 border-t border-border px-6 py-4">
          <Button
            type="button"
            variant="outline"
            className="rounded-2xl"
            onClick={() => onOpenChange(false)}
          >
            {labels.cancel}
          </Button>
          <Button
            type="button"
            className="rounded-2xl"
            onClick={() => void handleSave()}
            disabled={isSaving}
          >
            {isSaving ? labels.saving : labels.save}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
