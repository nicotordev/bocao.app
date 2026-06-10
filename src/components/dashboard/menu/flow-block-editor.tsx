"use client";

import {
  TbPlus,
  TbTrash,
} from "react-icons/tb";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { createEmptyLocalizedLabel } from "@/i18n/iso-languages";
import { defaultLocale } from "@/i18n/locales";
import {
  createFlowOptionId,
  resolveLocalizedLabel,
  slugifyFlowKey,
} from "@/lib/product-flow/engine";
import type {
  FlowBlockConfig,
  FlowBlockType,
  FlowOption,
  ProductFlowBlockRecord,
} from "@/lib/product-flow/types";
import { FlowLocalizedField } from "./flow-localized-field";
import type { MenuLocaleOption, ProductFlowLabels } from "./types";

type FlowBlockEditorProps = {
  labels: ProductFlowLabels;
  localeOptions: MenuLocaleOption[];
  currency: string;
  blockKey?: string;
  blockType: FlowBlockType;
  config: FlowBlockConfig;
  menuItems: Array<{ id: string; name: string }>;
  onBlockKeyChange?: (key: string) => void;
  onBlockTypeChange?: (type: FlowBlockType) => void;
  onConfigChange: (config: FlowBlockConfig) => void;
};

const BLOCK_TYPES: FlowBlockType[] = [
  "choice",
  "multi_choice",
  "quantity",
  "text",
  "info",
  "upsell",
];

export function FlowBlockEditor({
  labels,
  localeOptions,
  currency,
  blockKey,
  blockType,
  config,
  menuItems,
  onBlockKeyChange,
  onBlockTypeChange,
  onConfigChange,
}: FlowBlockEditorProps) {
  const showOptions = blockType === "choice" || blockType === "multi_choice";
  const showQuantityRules = blockType === "quantity" || blockType === "multi_choice";
  const showUpsellTarget = blockType === "upsell";

  function updateConfig(patch: Partial<FlowBlockConfig>) {
    onConfigChange({ ...config, ...patch });
  }

  function updateOption(optionId: string, patch: Partial<FlowOption>) {
    updateConfig({
      options: (config.options ?? []).map((option) =>
        option.id === optionId ? { ...option, ...patch } : option,
      ),
    });
  }

  function addOption() {
    updateConfig({
      options: [
        ...(config.options ?? []),
        {
          id: createFlowOptionId(),
          label: createEmptyLocalizedLabel(defaultLocale),
          isAvailable: true,
        },
      ],
    });
  }

  function removeOption(optionId: string) {
    updateConfig({
      options: (config.options ?? []).filter(
        (option) => option.id !== optionId,
      ),
    });
  }

  return (
    <div className="space-y-4">
      {onBlockTypeChange ? (
        <Field>
          <FieldLabel>{labels.blockEditor.type}</FieldLabel>
          <Select
            value={blockType}
            onValueChange={(value) => onBlockTypeChange(value as FlowBlockType)}
          >
            <SelectTrigger className="rounded-2xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              {BLOCK_TYPES.map((type) => (
                <SelectItem key={type} value={type} className="rounded-lg">
                  {labels.blockTypes[type]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      ) : null}

      {onBlockKeyChange ? (
        <Field>
          <FieldLabel>{labels.blockEditor.key}</FieldLabel>
          <Input
            value={blockKey ?? ""}
            onChange={(event) => onBlockKeyChange(event.target.value)}
            onBlur={() => {
              if (!blockKey?.trim()) {
                const fallback = resolveLocalizedLabel(
                  config.label,
                  localeOptions[0]?.value ?? "es",
                );
                onBlockKeyChange(slugifyFlowKey(fallback || "bloque"));
              }
            }}
            placeholder={labels.blockEditor.keyPlaceholder}
            className="rounded-2xl"
          />
        </Field>
      ) : null}

        <FlowLocalizedField
          label={labels.blockEditor.stepLabel}
          localeOptions={localeOptions}
          value={config.label}
          onChange={(label) => updateConfig({ label })}
          required
          languagesLabel={labels.blockEditor.languages}
        />

      {blockType !== "info" ? (
        <FlowLocalizedField
          label={labels.blockEditor.description}
          localeOptions={localeOptions}
          value={config.description ?? {}}
          onChange={(description) => updateConfig({ description })}
          multiline
          languagesLabel={labels.blockEditor.languages}
        />
      ) : null}

      {blockType === "info" ? (
        <FlowLocalizedField
          label={labels.blockEditor.infoContent}
          localeOptions={localeOptions}
          value={config.infoContent ?? {}}
          onChange={(infoContent) => updateConfig({ infoContent })}
          multiline
          required
          languagesLabel={labels.blockEditor.languages}
        />
      ) : null}

      {blockType === "text" ? (
        <FlowLocalizedField
          label={labels.blockEditor.placeholder}
          localeOptions={localeOptions}
          value={config.placeholder ?? {}}
          onChange={(placeholder) => updateConfig({ placeholder })}
          languagesLabel={labels.blockEditor.languages}
        />
      ) : null}

      {blockType !== "info" && blockType !== "upsell" ? (
        <div className="flex items-center gap-3 rounded-2xl border border-border px-3 py-2">
          <Switch
            id="flow-block-required"
            checked={config.required !== false}
            onCheckedChange={(checked) => updateConfig({ required: checked })}
          />
          <FieldLabel htmlFor="flow-block-required" className="cursor-pointer">
            {labels.blockEditor.required}
          </FieldLabel>
        </div>
      ) : null}

      {showQuantityRules ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {blockType === "multi_choice" ? (
            <>
              <Field>
                <FieldLabel>{labels.blockEditor.minSelections}</FieldLabel>
                <Input
                  type="number"
                  min={0}
                  value={config.minSelections ?? 0}
                  onChange={(event) =>
                    updateConfig({
                      minSelections: Number.parseInt(event.target.value, 10),
                    })
                  }
                  className="rounded-2xl"
                />
              </Field>
              <Field>
                <FieldLabel>{labels.blockEditor.maxSelections}</FieldLabel>
                <Input
                  type="number"
                  min={1}
                  value={config.maxSelections ?? ""}
                  onChange={(event) =>
                    updateConfig({
                      maxSelections: event.target.value
                        ? Number.parseInt(event.target.value, 10)
                        : undefined,
                    })
                  }
                  className="rounded-2xl"
                />
              </Field>
            </>
          ) : (
            <>
              <Field>
                <FieldLabel>{labels.blockEditor.minQuantity}</FieldLabel>
                <Input
                  type="number"
                  min={0}
                  value={config.minQuantity ?? 0}
                  onChange={(event) =>
                    updateConfig({
                      minQuantity: Number.parseInt(event.target.value, 10),
                    })
                  }
                  className="rounded-2xl"
                />
              </Field>
              <Field>
                <FieldLabel>{labels.blockEditor.maxQuantity}</FieldLabel>
                <Input
                  type="number"
                  min={1}
                  value={config.maxQuantity ?? 99}
                  onChange={(event) =>
                    updateConfig({
                      maxQuantity: Number.parseInt(event.target.value, 10),
                    })
                  }
                  className="rounded-2xl"
                />
              </Field>
            </>
          )}
        </div>
      ) : null}

      {showUpsellTarget ? (
        <Field>
          <FieldLabel>{labels.blockEditor.upsellProduct}</FieldLabel>
          <Select
            value={config.menuItemId ?? undefined}
            onValueChange={(value) => updateConfig({ menuItemId: value })}
          >
            <SelectTrigger className="rounded-2xl">
              <SelectValue placeholder={labels.blockEditor.upsellProductPlaceholder} />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              {menuItems.map((item) => (
                <SelectItem key={item.id} value={item.id} className="rounded-lg">
                  {item.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      ) : null}

      {showOptions ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">{labels.blockEditor.options}</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-2 rounded-2xl"
              onClick={addOption}
            >
              <TbPlus className="size-4" aria-hidden />
              {labels.blockEditor.addOption}
            </Button>
          </div>

          {(config.options ?? []).map((option, index) => (
            <div
              key={option.id}
              className="space-y-3 rounded-2xl border border-border p-4"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">
                  {labels.blockEditor.option} {index + 1}
                </p>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => removeOption(option.id)}
                  aria-label={labels.blockEditor.removeOption}
                >
                  <TbTrash className="size-4" aria-hidden />
                </Button>
              </div>

              <FlowLocalizedField
                label={labels.blockEditor.optionLabel}
                localeOptions={localeOptions}
                value={option.label}
                onChange={(label) => updateOption(option.id, { label })}
                required
                languagesLabel={labels.blockEditor.languages}
              />

              <div className="grid gap-3 sm:grid-cols-2">
                <Field>
                  <FieldLabel>{labels.blockEditor.priceDelta}</FieldLabel>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={
                      option.priceCents !== undefined
                        ? String(option.priceCents / 100)
                        : ""
                    }
                    onChange={(event) =>
                      updateOption(option.id, {
                        priceCents: event.target.value
                          ? Math.round(
                              Number.parseFloat(event.target.value) * 100,
                            )
                          : undefined,
                      })
                    }
                    placeholder={`0 ${currency}`}
                    className="rounded-2xl"
                  />
                </Field>
                <Field>
                  <FieldLabel>{labels.blockEditor.priceMode}</FieldLabel>
                  <Select
                    value={option.priceMode ?? "delta"}
                    onValueChange={(value) =>
                      updateOption(option.id, {
                        priceMode: value as "delta" | "override",
                      })
                    }
                  >
                    <SelectTrigger className="rounded-2xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="delta" className="rounded-lg">
                        {labels.blockEditor.priceModeDelta}
                      </SelectItem>
                      <SelectItem value="override" className="rounded-lg">
                        {labels.blockEditor.priceModeOverride}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              </div>

              <div className="flex items-center gap-3">
                <Switch
                  id={`option-default-${option.id}`}
                  checked={option.isDefault === true}
                  onCheckedChange={(checked) =>
                    updateOption(option.id, { isDefault: checked })
                  }
                />
                <FieldLabel
                  htmlFor={`option-default-${option.id}`}
                  className="cursor-pointer"
                >
                  {labels.blockEditor.defaultOption}
                </FieldLabel>
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function createEmptyFlowBlockConfig(
  locale: string = defaultLocale,
): FlowBlockConfig {
  return {
    label: createEmptyLocalizedLabel(locale),
    required: true,
    options: [],
  };
}

export function mapBlockToEditorState(block: ProductFlowBlockRecord) {
  return {
    key: block.key,
    type: block.type,
    config: block.config,
  };
}
