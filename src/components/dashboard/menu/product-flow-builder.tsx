"use client";

import {
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  TbEye,
  TbGripVertical,
  TbPlus,
  TbTrash,
  TbRoute,
} from "react-icons/tb";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { createFlowTemplateAction } from "@/app/actions/product-flow";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { FieldLabel } from "@/components/ui/field";
import { Badge } from "@/components/ui/badge";
import { createEmptyLocalizedLabel } from "@/i18n/iso-languages";
import {
  createFlowOptionId,
  createFlowStepId,
  resolveAllSteps,
  resolveLocalizedLabel,
  resolveVisibleSteps,
} from "@/lib/product-flow/engine";
import type {
  FlowBlockConfig,
  FlowBlockType,
  FlowStep,
  ProductFlowBlockRecord,
  ProductFlowTemplateRecord,
  ProductPurchaseFlowRecord,
} from "@/lib/product-flow/types";
import { ProductPurchaseWizard } from "@/components/dashboard/orders/new/product-purchase-wizard";
import { PromptDialog } from "@/components/ui/prompt-dialog";
import {
  createEmptyFlowBlockConfig,
  FlowBlockEditor,
} from "./flow-block-editor";
import type { MenuLocaleOption, ProductFlowLabels } from "./types";
import { cn } from "@/lib/utils";

const BLOCK_TYPES: FlowBlockType[] = [
  "choice",
  "multi_choice",
  "quantity",
  "text",
  "info",
  "upsell",
];

type ProductFlowBuilderProps = {
  labels: ProductFlowLabels;
  localeOptions: MenuLocaleOption[];
  currency: string;
  menuItemId?: string;
  categoryId: string;
  menuItemName: string;
  basePriceCents: number;
  blocks: ProductFlowBlockRecord[];
  templates: ProductFlowTemplateRecord[];
  menuItems: Array<{ id: string; name: string; priceCents: number }>;
  restaurantId: string;
  value: {
    isActive: boolean;
    steps: FlowStep[];
  };
  onChange: (value: { isActive: boolean; steps: FlowStep[] }) => void;
  onTemplateCreated?: (template: ProductFlowTemplateRecord) => void;
};

function getStepLabel(
  step: FlowStep,
  blocks: ProductFlowBlockRecord[],
  locale: MenuLocaleOption["value"],
  labels: ProductFlowLabels["builder"],
) {
  const resolved = resolveAllSteps([step], blocks)[0];

  if (resolved) {
    const label = resolveLocalizedLabel(resolved.config.label, locale);
    if (label) {
      return label;
    }
  }

  if (step.kind === "conditional") {
    return labels.conditional;
  }

  return labels.step;
}

function resolveStepEditorState(
  step: FlowStep,
  blocks: ProductFlowBlockRecord[],
) {
  if (step.kind === "conditional") {
    return null;
  }

  const resolved = resolveAllSteps([step], blocks)[0];

  if (!resolved) {
    return null;
  }

  return {
    type: resolved.type,
    config: resolved.config,
  };
}

function SortableFlowStepRow({
  id,
  label,
  typeLabel,
  selected,
  reorderAriaLabel,
  removeAriaLabel,
  onSelect,
  onRemove,
}: {
  id: string;
  label: string;
  typeLabel: string;
  selected: boolean;
  reorderAriaLabel: string;
  removeAriaLabel: string;
  onSelect: () => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={cn(
        "flex items-center gap-3 rounded-2xl border bg-card p-3 transition-colors",
        selected
          ? "border-primary/40 ring-2 ring-primary/15"
          : "border-border",
      )}
    >
      <button
        type="button"
        className="cursor-grab text-muted-foreground active:cursor-grabbing"
        aria-label={reorderAriaLabel}
        {...attributes}
        {...listeners}
      >
        <TbGripVertical className="size-4" aria-hidden />
      </button>
      <button
        type="button"
        className="min-w-0 flex-1 text-left"
        onClick={onSelect}
      >
        <p className="truncate text-sm font-medium">{label}</p>
        <Badge variant="secondary" className="mt-1">
          {typeLabel}
        </Badge>
      </button>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        onClick={onRemove}
        aria-label={removeAriaLabel}
      >
        <TbTrash className="size-4" aria-hidden />
      </Button>
    </div>
  );
}

export function ProductFlowBuilder({
  labels,
  localeOptions,
  currency,
  menuItemId,
  categoryId,
  menuItemName,
  basePriceCents,
  blocks,
  templates,
  menuItems,
  restaurantId,
  value,
  onChange,
  onTemplateCreated,
}: ProductFlowBuilderProps) {
  const locale = localeOptions[0]?.value ?? "es";
  const [previewOpen, setPreviewOpen] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);
  const [saveTemplateOpen, setSaveTemplateOpen] = useState(false);
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const stepIds = value.steps.map((step) => step.id);
  const selectedStep =
    value.steps.find((step) => step.id === selectedStepId) ?? null;
  const selectedEditorState = selectedStep
    ? resolveStepEditorState(selectedStep, blocks)
    : null;

  const previewFlow: ProductPurchaseFlowRecord | null = useMemo(() => {
    if (!value.isActive || value.steps.length === 0) {
      return null;
    }

    return {
      id: "preview",
      menuItemId: "preview",
      version: 1,
      isActive: true,
      steps: value.steps,
    };
  }, [value.isActive, value.steps]);

  function addInlineStep(type: FlowBlockType) {
    const config = createEmptyFlowBlockConfig(locale);

    if (type === "choice" || type === "multi_choice") {
      config.options = [
        {
          id: createFlowOptionId(),
          label: createEmptyLocalizedLabel(locale),
          isAvailable: true,
        },
      ];
    }

    const stepId = createFlowStepId();

    onChange({
      ...value,
      isActive: true,
      steps: [
        ...value.steps,
        {
          kind: "inline",
          id: stepId,
          type,
          config,
        },
      ],
    });
    setSelectedStepId(stepId);
  }

  function addBlockStep(blockId: string) {
    const block = blocks.find((entry) => entry.id === blockId);

    if (!block) {
      return;
    }

    const stepId = createFlowStepId();

    onChange({
      ...value,
      isActive: true,
      steps: [
        ...value.steps,
        {
          kind: "block",
          id: stepId,
          blockId,
        },
      ],
    });
    setSelectedStepId(stepId);
  }

  function updateSelectedStep(type: FlowBlockType, config: FlowBlockConfig) {
    if (!selectedStepId) {
      return;
    }

    const nextConfig = { ...config };

    if (
      (type === "choice" || type === "multi_choice") &&
      (nextConfig.options?.length ?? 0) === 0
    ) {
      nextConfig.options = [
        {
          id: createFlowOptionId(),
          label: createEmptyLocalizedLabel(locale),
          isAvailable: true,
        },
      ];
    }

    onChange({
      ...value,
      steps: value.steps.map((step) =>
        step.id === selectedStepId
          ? {
              kind: "inline",
              id: step.id,
              type,
              config: nextConfig,
            }
          : step,
      ),
    });
  }

  function openSaveTemplateDialog() {
    if (value.steps.length === 0) {
      return;
    }

    setSaveTemplateOpen(true);
  }

  async function handleSaveTemplate(name: string) {
    try {
      setIsSavingTemplate(true);

      const scope = menuItemId
        ? {
            scopeType: "menu_item" as const,
            menuItemId,
          }
        : {
            scopeType: "category" as const,
            categoryId,
          };

      const result = await createFlowTemplateAction({
        restaurantId,
        ...scope,
        name,
        steps: value.steps,
      });
      onTemplateCreated?.(result.template);
      toast.success(labels.builder.saved);
      setSaveTemplateOpen(false);
    } catch {
      toast.error(labels.builder.saveError);
    } finally {
      setIsSavingTemplate(false);
    }
  }

  function applyTemplate(templateId: string) {
    const template = templates.find((entry) => entry.id === templateId);

    if (!template) {
      return;
    }

    onChange({
      isActive: true,
      steps: template.steps,
    });
    setSelectedTemplateId("");
    setSelectedStepId(template.steps[0]?.id ?? null);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = value.steps.findIndex((step) => step.id === active.id);
    const newIndex = value.steps.findIndex((step) => step.id === over.id);

    if (oldIndex < 0 || newIndex < 0) {
      return;
    }

    onChange({
      ...value,
      steps: arrayMove(value.steps, oldIndex, newIndex),
    });
  }

  function removeStep(stepId: string) {
    onChange({
      ...value,
      steps: value.steps.filter((step) => step.id !== stepId),
    });

    if (selectedStepId === stepId) {
      setSelectedStepId(null);
    }
  }

  const visibleStepCount = resolveVisibleSteps(value.steps, blocks, {}).length;
  const isBuilderEnabled = value.isActive;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 rounded-3xl border border-border bg-muted/20 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <TbRoute className="size-5" aria-hidden />
          </div>
          <div>
            <p className="font-medium">{labels.builder.title}</p>
            <p className="text-sm text-muted-foreground">
              {labels.builder.description}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Switch
            id="product-flow-active"
            checked={value.isActive}
            onCheckedChange={(checked) => {
              onChange({ ...value, isActive: checked });
            }}
          />
          <FieldLabel
            htmlFor="product-flow-active"
            className="cursor-pointer"
            onClick={() => onChange({ ...value, isActive: !value.isActive })}
          >
            {labels.builder.enabled}
          </FieldLabel>
        </div>
      </div>

      {!isBuilderEnabled ? (
        <div className="rounded-3xl border border-dashed border-border bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
          {labels.builder.inactiveHint}
        </div>
      ) : null}

      <div
        className={
          isBuilderEnabled
            ? "space-y-5"
            : "pointer-events-none space-y-5 opacity-50"
        }
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          {templates.length > 0 ? (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <p className="text-sm font-medium">
                {labels.builder.applyTemplate}
              </p>
              <Select value={selectedTemplateId} onValueChange={applyTemplate}>
                <SelectTrigger className="rounded-2xl sm:max-w-xs">
                  <SelectValue
                    placeholder={labels.builder.templatePlaceholder}
                  />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {templates.map((template) => (
                    <SelectItem
                      key={template.id}
                      value={template.id}
                      className="rounded-lg"
                    >
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <span />
          )}
          {value.steps.length > 0 ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-2xl"
              onClick={openSaveTemplateDialog}
            >
              {labels.library.newTemplate}
            </Button>
          ) : null}
        </div>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,13rem)_minmax(0,1fr)_minmax(0,1.35fr)]">
          <aside className="space-y-3 rounded-3xl border border-border p-4">
            <p className="text-sm font-medium">{labels.builder.addStep}</p>
            <div className="space-y-2">
              {BLOCK_TYPES.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => addInlineStep(type)}
                  className="flex w-full items-center justify-between gap-2 rounded-2xl border border-border bg-card px-3 py-2 text-left text-sm transition-colors hover:border-primary/30"
                >
                  <span>{labels.blockTypes[type]}</span>
                  <TbPlus className="size-4 shrink-0" aria-hidden />
                </button>
              ))}
            </div>

            {blocks.length > 0 ? (
              <div className="space-y-2 border-t border-border pt-4">
                <p className="text-xs font-medium text-muted-foreground">
                  {labels.builder.fromLibrary}
                </p>
                {blocks.map((block) => (
                  <button
                    key={block.id}
                    type="button"
                    onClick={() => addBlockStep(block.id)}
                    className="flex w-full items-center justify-between gap-2 rounded-2xl border border-border bg-card px-3 py-2 text-left text-sm transition-colors hover:border-primary/30"
                  >
                    <span className="truncate">
                      {resolveLocalizedLabel(block.config.label, locale)}
                    </span>
                    <TbPlus className="size-4 shrink-0" aria-hidden />
                  </button>
                ))}
              </div>
            ) : null}
          </aside>

          <div className="space-y-3 rounded-3xl border border-border p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium">{labels.builder.steps}</p>
                <p className="text-xs text-muted-foreground">
                  {labels.builder.stepCount.replace(
                    "{count}",
                    String(visibleStepCount),
                  )}
                </p>
              </div>
              {previewFlow ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-2 rounded-2xl"
                  onClick={() => setPreviewOpen(true)}
                >
                  <TbEye className="size-4" aria-hidden />
                  {labels.builder.preview}
                </Button>
              ) : null}
            </div>

            {value.steps.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-6 text-center text-sm text-muted-foreground">
                {labels.builder.emptySteps}
              </div>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={stepIds}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2">
                    {value.steps.map((step) => {
                      const resolved = resolveAllSteps([step], blocks)[0];
                      const typeLabel = resolved
                        ? labels.blockTypes[resolved.type]
                        : step.kind === "conditional"
                          ? labels.builder.conditional
                          : labels.builder.step;

                      return (
                        <SortableFlowStepRow
                          key={step.id}
                          id={step.id}
                          label={getStepLabel(
                            step,
                            blocks,
                            locale,
                            labels.builder,
                          )}
                          typeLabel={typeLabel}
                          selected={selectedStepId === step.id}
                          reorderAriaLabel={labels.builder.ariaReorder}
                          removeAriaLabel={labels.builder.ariaRemoveStep}
                          onSelect={() => setSelectedStepId(step.id)}
                          onRemove={() => removeStep(step.id)}
                        />
                      );
                    })}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </div>

          <div className="space-y-3 rounded-3xl border border-border p-4">
            <p className="text-sm font-medium">{labels.builder.editStep}</p>
            {selectedEditorState ? (
              <FlowBlockEditor
                labels={labels}
                localeOptions={localeOptions}
                currency={currency}
                blockType={selectedEditorState.type}
                config={selectedEditorState.config}
                menuItems={menuItems}
                onBlockTypeChange={(type) =>
                  updateSelectedStep(type, selectedEditorState.config)
                }
                onConfigChange={(config) =>
                  updateSelectedStep(selectedEditorState.type, config)
                }
              />
            ) : (
              <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-6 text-center text-sm text-muted-foreground">
                {labels.builder.selectStep}
              </div>
            )}
          </div>
        </div>

        <PromptDialog
          open={saveTemplateOpen}
          onOpenChange={setSaveTemplateOpen}
          title={labels.library.createTemplateTitle}
          description={labels.library.templateDescription}
          label={labels.library.templateName}
          defaultValue={menuItemName}
          confirmLabel={labels.library.newTemplate}
          cancelLabel={labels.actions.cancel}
          onConfirm={(name) => void handleSaveTemplate(name)}
          isPending={isSavingTemplate}
        />

        {previewFlow ? (
          <ProductPurchaseWizard
            open={previewOpen}
            onOpenChange={setPreviewOpen}
            labels={labels.wizard}
            localeOptions={localeOptions}
            currency={currency}
            menuItem={{
              id: "preview",
              name: menuItemName,
              description: null,
              priceCents: basePriceCents,
              categoryName: "",
              images: [],
              purchaseFlow: previewFlow,
              flowBlocks: blocks,
            }}
            allMenuItems={menuItems}
            onConfirm={() => setPreviewOpen(false)}
          />
        ) : null}
      </div>
    </div>
  );
}
