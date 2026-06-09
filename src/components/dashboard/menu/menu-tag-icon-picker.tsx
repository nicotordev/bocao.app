"use client";

import type { MenuTagIconId } from "@/lib/menu/tag-icons";
import { MENU_TAG_ICON_IDS, MENU_TAG_ICONS } from "@/lib/menu/tag-icons";
import { cn } from "@/lib/utils";

type MenuTagIconPickerProps = {
  value?: MenuTagIconId;
  onChange: (icon: MenuTagIconId) => void;
  disabled?: boolean;
  className?: string;
};

export function MenuTagIconPicker({
  value,
  onChange,
  disabled = false,
  className,
}: MenuTagIconPickerProps) {
  return (
    <div className={cn("grid grid-cols-5 gap-1.5 sm:grid-cols-10", className)}>
      {MENU_TAG_ICON_IDS.map((iconId) => {
        const Icon = MENU_TAG_ICONS[iconId];

        const isSelected = value === iconId;

        return (
          <button
            key={iconId}
            type="button"
            disabled={disabled}
            aria-pressed={isSelected}
            aria-label={iconId}
            className={cn(
              "flex size-9 items-center justify-center rounded-xl border transition-colors",
              isSelected
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground",
              disabled && "pointer-events-none opacity-50",
            )}
            onClick={() => onChange(iconId)}
          >
            <Icon className="size-4" aria-hidden />
          </button>
        );
      })}
    </div>
  );
}

export function MenuTagIconGlyph({
  icon,
  className,
}: {
  icon?: MenuTagIconId;
  className?: string;
}) {
  if (!icon) {
    return null;
  }

  const Icon = MENU_TAG_ICONS[icon];
  return <Icon className={className} aria-hidden />;
}
