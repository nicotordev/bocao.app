"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale } from "next-intl";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { FieldLabel } from "@/components/ui/field";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/orders/currency";
import {
  buildCustomizationSnapshot,
  buildCustomizedLineName,
  computeFlowLinePrice,
  createInitialSelections,
  resolveLocalizedLabel,
  resolveVisibleSteps,
  validateFlowSelections,
} from "@/lib/product-flow/engine";
import type {
  FlowSelections,
  MenuItemWithFlowOption,
  OrderLineCustomization,
  ResolvedFlowStep,
  StepSelection,
} from "@/lib/product-flow/types";
import type { MenuLocaleOption } from "@/components/dashboard/menu/types";

export type ProductPurchaseWizardResult = {
  name: string;
  priceCents: number;
  customization: OrderLineCustomization;
};

export type ProductFlowWizardLabels = {
  title: string;
  description: string;
  stepOf: string;
  back: string;
  next: string;
  confirm: string;
  cancel: string;
  required: string;
  optional: string;
  quantity: string;
  upsellAccept: string;
  upsellDecline: string;
  total: string;
  validationError: string;
};

type ProductPurchaseWizardProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  labels: ProductFlowWizardLabels;
  localeOptions: MenuLocaleOption[];
  currency: string;
  menuItem: MenuItemWithFlowOption;
  allMenuItems: Array<{ id: string; name: string; priceCents: number }>;
  onConfirm: (result: ProductPurchaseWizardResult) => void;
};

export function ProductPurchaseWizard({
  open,
  onOpenChange,
  labels,
  currency,
  menuItem,
  allMenuItems,
  onConfirm,
}: ProductPurchaseWizardProps) {
  const locale = useLocale() as MenuLocaleOption["value"];
  const flow = menuItem.purchaseFlow;
  const [stepIndex, setStepIndex] = useState(0);
  const [selections, setSelections] = useState<FlowSelections>({});
  const [validationError, setValidationError] = useState("");

  const menuItemPrices = useMemo(
    () => new Map(allMenuItems.map((item) => [item.id, item.priceCents])),
    [allMenuItems],
  );

  const visibleSteps = useMemo(() => {
    if (!flow) {
      return [];
    }

    return resolveVisibleSteps(flow.steps, menuItem.flowBlocks, selections);
  }, [flow, menuItem.flowBlocks, selections]);

  useEffect(() => {
    if (!open || !flow) {
      return;
    }

    setSelections(
      createInitialSelections(flow.steps, menuItem.flowBlocks),
    );
    setStepIndex(0);
    setValidationError("");
  }, [open, flow, menuItem.flowBlocks]);

  useEffect(() => {
    if (stepIndex >= visibleSteps.length && visibleSteps.length > 0) {
      setStepIndex(visibleSteps.length - 1);
    }
  }, [stepIndex, visibleSteps.length]);

  const currentStep = visibleSteps[stepIndex];
  const isLastStep = stepIndex >= visibleSteps.length - 1;

  const livePrice = useMemo(() => {
    if (!flow) {
      return menuItem.priceCents;
    }

    return computeFlowLinePrice({
      basePriceCents: menuItem.priceCents,
      steps: flow.steps,
      blocks: menuItem.flowBlocks,
      selections,
      locale,
      menuItemPrices,
    }).computedPriceCents;
  }, [
    flow,
    menuItem.priceCents,
    menuItem.flowBlocks,
    selections,
    locale,
    menuItemPrices,
  ]);

  function updateSelection(stepId: string, selection: StepSelection) {
    setSelections((current) => ({ ...current, [stepId]: selection }));
    setValidationError("");
  }

  function validateCurrentStep() {
    if (!flow || !currentStep) {
      return true;
    }

    const errors = validateFlowSelections({
      steps: [findRawStep(flow.steps, currentStep.id) ?? {
        kind: "inline",
        id: currentStep.id,
        type: currentStep.type,
        config: currentStep.config,
      }],
      blocks: menuItem.flowBlocks,
      selections,
      locale,
    });

    if (errors.length > 0) {
      setValidationError(labels.validationError);
      return false;
    }

    return true;
  }

  function handleNext() {
    if (!validateCurrentStep()) {
      return;
    }

    if (isLastStep) {
      handleConfirm();
      return;
    }

    setStepIndex((current) => current + 1);
  }

  function handleConfirm() {
    if (!flow) {
      return;
    }

    const errors = validateFlowSelections({
      steps: flow.steps,
      blocks: menuItem.flowBlocks,
      selections,
      locale,
    });

    if (errors.length > 0) {
      setValidationError(labels.validationError);
      return;
    }

    const customization = buildCustomizationSnapshot({
      flowId: flow.id,
      flowVersion: flow.version,
      basePriceCents: menuItem.priceCents,
      productName: menuItem.name,
      steps: flow.steps,
      blocks: menuItem.flowBlocks,
      selections,
      locale,
      menuItemPrices,
    });

    onConfirm({
      name: buildCustomizedLineName(menuItem.name, customization),
      priceCents: customization.computedPriceCents,
      customization,
    });
    onOpenChange(false);
  }

  if (!flow || !flow.isActive || flow.steps.length === 0) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(90vh,720px)] max-w-lg flex-col gap-0 overflow-hidden p-0">
        <DialogHeader className="border-b border-border px-6 py-5">
          <DialogTitle>{labels.title}</DialogTitle>
          <DialogDescription>
            {labels.description.replace("{product}", menuItem.name)}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 space-y-5 overflow-y-auto p-6">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {labels.stepOf
                .replace("{current}", String(stepIndex + 1))
                .replace("{total}", String(visibleSteps.length))}
            </span>
            <span className="font-medium">
              {labels.total}: {formatCurrency(livePrice, currency)}
            </span>
          </div>

          {validationError ? (
            <div className="rounded-2xl bg-destructive/10 p-3 text-sm text-destructive">
              {validationError}
            </div>
          ) : null}

          {currentStep ? (
            <FlowStepPanel
              step={currentStep}
              locale={locale}
              currency={currency}
              labels={labels}
              selection={selections[currentStep.id]}
              menuItemPrices={menuItemPrices}
              allMenuItems={allMenuItems}
              onChange={(selection) => updateSelection(currentStep.id, selection)}
            />
          ) : null}
        </div>

        <DialogFooter className="border-t border-border px-6 py-4">
          <Button
            type="button"
            variant="outline"
            className="rounded-2xl"
            onClick={() => onOpenChange(false)}
          >
            {labels.cancel}
          </Button>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="gap-2 rounded-2xl"
              onClick={() => setStepIndex((current) => Math.max(0, current - 1))}
              disabled={stepIndex === 0}
            >
              <ChevronLeft className="size-4" aria-hidden />
              {labels.back}
            </Button>
            <Button
              type="button"
              className="gap-2 rounded-2xl"
              onClick={handleNext}
            >
              {isLastStep ? labels.confirm : labels.next}
              {!isLastStep ? (
                <ChevronRight className="size-4" aria-hidden />
              ) : null}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function findRawStep(
  steps: import("@/lib/product-flow/types").FlowStep[],
  stepId: string,
): import("@/lib/product-flow/types").FlowStep | null {
  for (const step of steps) {
    if (step.id === stepId) {
      return step;
    }

    if (step.kind === "conditional") {
      const nested = findRawStep(step.then, stepId);

      if (nested) {
        return nested;
      }
    }
  }

  return null;
}

function FlowStepPanel({
  step,
  locale,
  currency,
  labels,
  selection,
  menuItemPrices,
  allMenuItems,
  onChange,
}: {
  step: ResolvedFlowStep;
  locale: MenuLocaleOption["value"];
  currency: string;
  labels: ProductFlowWizardLabels;
  selection?: StepSelection;
  menuItemPrices: Map<string, number>;
  allMenuItems: Array<{ id: string; name: string; priceCents: number }>;
  onChange: (selection: StepSelection) => void;
}) {
  const title = resolveLocalizedLabel(step.config.label, locale);
  const description = resolveLocalizedLabel(step.config.description, locale);
  const required = step.config.required !== false;

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-heading text-lg font-semibold">{title}</h3>
        {description ? (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        ) : null}
        <p className="mt-2 text-xs text-muted-foreground">
          {required ? labels.required : labels.optional}
        </p>
      </div>

      {step.type === "choice" ? (
        <div className="space-y-2">
          {(step.config.options ?? []).map((option) => {
            if (option.isAvailable === false) {
              return null;
            }

            const selected =
              selection?.type === "choice" &&
              selection.optionId === option.id;
            const priceLabel =
              option.priceCents && option.priceCents > 0
                ? `+${formatCurrency(option.priceCents, currency)}`
                : null;

            return (
              <button
                key={option.id}
                type="button"
                onClick={() => onChange({ type: "choice", optionId: option.id })}
                className={cn(
                  "flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition-colors",
                  selected
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/30",
                )}
              >
                <span>{resolveLocalizedLabel(option.label, locale)}</span>
                {priceLabel ? (
                  <span className="text-sm text-muted-foreground">
                    {priceLabel}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      ) : null}

      {step.type === "multi_choice" ? (
        <div className="space-y-2">
          {(step.config.options ?? []).map((option) => {
            if (option.isAvailable === false) {
              return null;
            }

            const selectedIds =
              selection?.type === "multi_choice" ? selection.optionIds : [];
            const selected = selectedIds.includes(option.id);
            const priceLabel =
              option.priceCents && option.priceCents > 0
                ? `+${formatCurrency(option.priceCents, currency)}`
                : null;

            return (
              <button
                key={option.id}
                type="button"
                onClick={() => {
                  const current =
                    selection?.type === "multi_choice"
                      ? selection.optionIds
                      : [];
                  const next = selected
                    ? current.filter((id) => id !== option.id)
                    : [...current, option.id];
                  onChange({ type: "multi_choice", optionIds: next });
                }}
                className={cn(
                  "flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition-colors",
                  selected
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/30",
                )}
              >
                <span>{resolveLocalizedLabel(option.label, locale)}</span>
                {priceLabel ? (
                  <span className="text-sm text-muted-foreground">
                    {priceLabel}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      ) : null}

      {step.type === "quantity" ? (
        <div className="flex items-center gap-3">
          <FieldLabel>{labels.quantity}</FieldLabel>
          <Input
            type="number"
            min={step.config.minQuantity ?? 0}
            max={step.config.maxQuantity ?? 99}
            value={
              selection?.type === "quantity"
                ? selection.quantity
                : (step.config.defaultQuantity ?? step.config.minQuantity ?? 0)
            }
            onChange={(event) =>
              onChange({
                type: "quantity",
                quantity: Number.parseInt(event.target.value, 10) || 0,
              })
            }
            className="max-w-28 rounded-2xl"
          />
        </div>
      ) : null}

      {step.type === "text" ? (
        <Textarea
          value={selection?.type === "text" ? selection.value : ""}
          onChange={(event) =>
            onChange({ type: "text", value: event.target.value })
          }
          placeholder={resolveLocalizedLabel(step.config.placeholder, locale)}
          className="rounded-2xl"
        />
      ) : null}

      {step.type === "info" ? (
        <div className="rounded-2xl border border-border bg-muted/20 p-4 text-sm">
          {resolveLocalizedLabel(step.config.infoContent, locale)}
          {required ? (
            <div className="mt-4 flex items-center gap-3">
              <Switch
                id={`info-${step.id}`}
                checked={
                  selection?.type === "info" ? selection.acknowledged : false
                }
                onCheckedChange={(checked) =>
                  onChange({ type: "info", acknowledged: checked })
                }
              />
              <FieldLabel htmlFor={`info-${step.id}`} className="cursor-pointer">
                {labels.required}
              </FieldLabel>
            </div>
          ) : null}
        </div>
      ) : null}

      {step.type === "upsell" ? (
        <UpsellPanel
          step={step}
          locale={locale}
          currency={currency}
          labels={labels}
          selection={selection}
          menuItemPrices={menuItemPrices}
          allMenuItems={allMenuItems}
          onChange={onChange}
        />
      ) : null}
    </div>
  );
}

function UpsellPanel({
  step,
  locale,
  currency,
  labels,
  selection,
  menuItemPrices,
  allMenuItems,
  onChange,
}: {
  step: ResolvedFlowStep;
  locale: MenuLocaleOption["value"];
  currency: string;
  labels: ProductFlowWizardLabels;
  selection?: StepSelection;
  menuItemPrices: Map<string, number>;
  allMenuItems: Array<{ id: string; name: string; priceCents: number }>;
  onChange: (selection: StepSelection) => void;
}) {
  const menuItemId = step.config.menuItemId;
  const upsellItem = allMenuItems.find((item) => item.id === menuItemId);
  const priceCents = menuItemId
    ? (menuItemPrices.get(menuItemId) ?? upsellItem?.priceCents ?? 0)
    : 0;
  const accepted = selection?.type === "upsell" ? selection.accepted : false;

  return (
    <div className="space-y-4 rounded-2xl border border-border p-4">
      <div>
        <p className="font-medium">
          {upsellItem?.name ??
            resolveLocalizedLabel(step.config.label, locale)}
        </p>
        <p className="text-sm text-muted-foreground">
          {formatCurrency(priceCents, currency)}
        </p>
      </div>
      <div className="flex gap-2">
        <Button
          type="button"
          variant={accepted ? "default" : "outline"}
          className="rounded-2xl"
          onClick={() =>
            onChange({ type: "upsell", accepted: true, quantity: 1 })
          }
        >
          {labels.upsellAccept}
        </Button>
        <Button
          type="button"
          variant={!accepted ? "secondary" : "outline"}
          className="rounded-2xl"
          onClick={() =>
            onChange({ type: "upsell", accepted: false, quantity: 0 })
          }
        >
          {labels.upsellDecline}
        </Button>
      </div>
    </div>
  );
}
