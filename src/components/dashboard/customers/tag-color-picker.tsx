"use client";

import { cn } from "@/lib/utils";

export const CUSTOMER_TAG_COLORS = [
  "#6366f1",
  "#22c55e",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#06b6d4",
  "#ec4899",
  "#64748b",
] as const;

type TagColorPickerProps = {
  value: string;
  onChange: (color: string) => void;
  label: string;
};

export function TagColorPicker({ value, onChange, label }: TagColorPickerProps) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">{label}</p>
      <div className="flex flex-wrap gap-2">
        {CUSTOMER_TAG_COLORS.map((color) => (
          <button
            key={color}
            type="button"
            aria-label={`${label}: ${color}`}
            aria-pressed={value === color}
            className={cn(
              "size-8 rounded-full border-2 transition-transform hover:scale-105",
              value === color
                ? "border-foreground ring-2 ring-ring/40"
                : "border-transparent",
            )}
            style={{ backgroundColor: color }}
            onClick={() => onChange(color)}
          />
        ))}
      </div>
    </div>
  );
}
