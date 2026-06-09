"use client";

import { Field, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { FlowLibraryScope, FlowLibraryScopeInput } from "@/lib/product-flow/types";
import type { ProductFlowLabels } from "./types";

type FlowLibraryScopeFieldProps = {
  labels: ProductFlowLabels;
  scopeType: FlowLibraryScope;
  categoryId: string;
  menuItemId: string;
  categories: Array<{ id: string; name: string }>;
  menuItems: Array<{ id: string; name: string }>;
  onScopeTypeChange: (scopeType: FlowLibraryScope) => void;
  onCategoryIdChange: (categoryId: string) => void;
  onMenuItemIdChange: (menuItemId: string) => void;
  disabled?: boolean;
};

export function flowLibraryScopeInputFromState(
  scopeType: FlowLibraryScope,
  categoryId: string,
  menuItemId: string,
): FlowLibraryScopeInput | null {
  if (scopeType === "category") {
    return categoryId ? { scopeType: "category", categoryId } : null;
  }

  return menuItemId ? { scopeType: "menu_item", menuItemId } : null;
}

export function FlowLibraryScopeField({
  labels,
  scopeType,
  categoryId,
  menuItemId,
  categories,
  menuItems,
  onScopeTypeChange,
  onCategoryIdChange,
  onMenuItemIdChange,
  disabled = false,
}: FlowLibraryScopeFieldProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field>
        <FieldLabel>{labels.library.scopeType}</FieldLabel>
        <Select
          value={scopeType}
          onValueChange={(value) => onScopeTypeChange(value as FlowLibraryScope)}
          disabled={disabled}
        >
          <SelectTrigger className="rounded-2xl">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="category" className="rounded-lg">
              {labels.library.scopeCategory}
            </SelectItem>
            <SelectItem value="menu_item" className="rounded-lg">
              {labels.library.scopeProduct}
            </SelectItem>
          </SelectContent>
        </Select>
      </Field>

      <Field>
        <FieldLabel>
          {scopeType === "category"
            ? labels.library.scopeCategory
            : labels.library.scopeProduct}
        </FieldLabel>
        {scopeType === "category" ? (
          <Select
            value={categoryId}
            onValueChange={onCategoryIdChange}
            disabled={disabled || categories.length === 0}
          >
            <SelectTrigger className="rounded-2xl">
              <SelectValue placeholder={labels.library.scopeCategoryPlaceholder} />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              {categories.map((category) => (
                <SelectItem
                  key={category.id}
                  value={category.id}
                  className="rounded-lg"
                >
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <Select
            value={menuItemId}
            onValueChange={onMenuItemIdChange}
            disabled={disabled || menuItems.length === 0}
          >
            <SelectTrigger className="rounded-2xl">
              <SelectValue placeholder={labels.library.scopeProductPlaceholder} />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              {menuItems.map((menuItem) => (
                <SelectItem
                  key={menuItem.id}
                  value={menuItem.id}
                  className="rounded-lg"
                >
                  {menuItem.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </Field>
    </div>
  );
}
