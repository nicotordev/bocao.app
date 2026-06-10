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
import {
  createFlowStepId,
  resolveLocalizedLabel,
  resolveVisibleSteps,
} from "@/lib/product-flow/engine";
import type {
  FlowStep,
  ProductFlowBlockRecord,
  ProductFlowTemplateRecord,
  ProductPurchaseFlowRecord,
} from "@/lib/product-flow/types";
import { ProductPurchaseWizard } from "@/components/dashboard/orders/new/product-purchase-wizard";
import type { MenuLocaleOption, ProductFlowLabels } from "./types";

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
  if (step.kind === "block") {
    const block = blocks.find((entry) => entry.id === step.blockId);
    return block
      ? resolveLocalizedLabel(block.config.label, locale)
      : labelsFallback(step, labels);
  }

  if (step.kind === "inline") {
    return resolveLocalizedLabel(step.config.label, locale);
  }

  return labelsFallback(step, labels);
}

function labelsFallback(step: FlowStep, labels: ProductFlowLabels["builder"]) {
  if (step.kind === "conditional") {
    return labels.conditional;
  }

  return labels.step;
}

function SortableFlowStepRow({
  id,
  label,
  typeLabel,
  reorderAriaLabel,
  removeAriaLabel,
  onRemove,
}: {
  id: string;
  label: string;
  typeLabel: string;
  reorderAriaLabel: string;
  removeAriaLabel: string;
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
      className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3"
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
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{label}</p>
        <Badge variant="secondary" className="mt-1">
          {typeLabel}
        </Badge>
      </div>
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

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const stepIds = value.steps.map((step) => step.id);

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

  function addBlockStep(blockId: string) {
    const block = blocks.find((entry) => entry.id === blockId);

    if (!block) {
      return;
    }

    onChange({
      ...value,
      isActive: true,
      steps: [
        ...value.steps,
        {
          kind: "block",
          id: createFlowStepId(),
          blockId,
        },
      ],
    });
  }

  async function saveAsTemplate() {
    if (value.steps.length === 0) {
      return;
    }

    const name = window.prompt(labels.builder.applyTemplate, menuItemName);

    if (!name?.trim()) {
      return;
    }

    try {
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
        name: name.trim(),
        steps: value.steps,
      });
      onTemplateCreated?.(result.template);
      toast.success(labels.builder.saved);
    } catch {
      toast.error(labels.builder.saveError);
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
              onClick={() => void saveAsTemplate()}
            >
              {labels.library.newTemplate}
            </Button>
          ) : null}
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,16rem)_minmax(0,1fr)]">
          <aside className="space-y-3 rounded-3xl border border-border p-4">
            <p className="text-sm font-medium">{labels.builder.library}</p>
            {blocks.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {labels.builder.emptyLibrary}
              </p>
            ) : (
              <div className="space-y-2">
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
            )}
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
                      const block =
                        step.kind === "block"
                          ? blocks.find((entry) => entry.id === step.blockId)
                          : null;
                      const typeLabel = block
                        ? labels.blockTypes[block.type]
                        : step.kind === "inline"
                          ? labels.blockTypes[step.type]
                          : labels.builder.conditional;

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
                          reorderAriaLabel={labels.builder.ariaReorder}
                          removeAriaLabel={labels.builder.ariaRemoveStep}
                          onRemove={() => removeStep(step.id)}
                        />
                      );
                    })}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </div>
        </div>

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
