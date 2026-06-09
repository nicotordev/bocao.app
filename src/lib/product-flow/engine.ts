import { defaultLocale } from "@/i18n/locales";
import type {
  FlowBlockConfig,
  FlowBlockType,
  FlowCondition,
  FlowLibraryScope,
  FlowLibraryScopeInput,
  FlowLibraryScopedRecord,
  FlowOption,
  FlowPriceMode,
  FlowSelections,
  FlowStep,
  LocalizedLabel,
  OrderLineCustomization,
  OrderLineSelectionSnapshot,
  ProductFlowBlockRecord,
  ProductFlowTemplateRecord,
  ResolvedFlowStep,
  StepSelection,
} from "./types";

export function createFlowStepId() {
  return crypto.randomUUID();
}

export function createFlowOptionId() {
  return crypto.randomUUID();
}

export function slugifyFlowKey(label: string) {
  return label
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

export function resolveLocalizedLabel(
  label: LocalizedLabel | undefined,
  locale: string,
): string {
  if (!label) {
    return "";
  }

  return (
    label[locale]?.trim() ||
    label[defaultLocale]?.trim() ||
    Object.values(label).find((value) => value?.trim())?.trim() ||
    ""
  );
}

function mergeBlockConfig(
  base: FlowBlockConfig,
  overrides?: Partial<FlowBlockConfig>,
): FlowBlockConfig {
  if (!overrides) {
    return base;
  }

  return {
    ...base,
    ...overrides,
    label: { ...base.label, ...overrides.label },
    description: overrides.description
      ? { ...base.description, ...overrides.description }
      : base.description,
    placeholder: overrides.placeholder
      ? { ...base.placeholder, ...overrides.placeholder }
      : base.placeholder,
    infoContent: overrides.infoContent
      ? { ...base.infoContent, ...overrides.infoContent }
      : base.infoContent,
    options: overrides.options ?? base.options,
  };
}

function mapBlockTypeFromDb(type: string): FlowBlockType {
  const normalized = type.toLowerCase().replace(/_/g, "_");

  if (normalized === "multi_choice") {
    return "multi_choice";
  }

  return normalized as FlowBlockType;
}

export function mapDbBlockType(type: string): FlowBlockType {
  switch (type) {
    case "CHOICE":
      return "choice";
    case "MULTI_CHOICE":
      return "multi_choice";
    case "QUANTITY":
      return "quantity";
    case "TEXT":
      return "text";
    case "INFO":
      return "info";
    case "UPSELL":
      return "upsell";
    default:
      return mapBlockTypeFromDb(type);
  }
}

export function mapUiBlockTypeToDb(type: FlowBlockType) {
  switch (type) {
    case "choice":
      return "CHOICE";
    case "multi_choice":
      return "MULTI_CHOICE";
    case "quantity":
      return "QUANTITY";
    case "text":
      return "TEXT";
    case "info":
      return "INFO";
    case "upsell":
      return "UPSELL";
  }
}

export function mapDbFlowLibraryScope(scope: string): FlowLibraryScope {
  return scope === "MENU_ITEM" ? "menu_item" : "category";
}

export function mapUiFlowLibraryScopeToDb(
  scope: FlowLibraryScope,
): import("@/generated/prisma/client").FlowLibraryScope {
  return scope === "menu_item" ? "MENU_ITEM" : "CATEGORY";
}

export function flowLibraryScopeMatches(
  item: FlowLibraryScopedRecord,
  scope: FlowLibraryScopeInput,
): boolean {
  if (scope.scopeType === "category") {
    return item.scopeType === "category" && item.categoryId === scope.categoryId;
  }

  return item.scopeType === "menu_item" && item.menuItemId === scope.menuItemId;
}

export function filterFlowLibraryForMenuItem<
  T extends FlowLibraryScopedRecord & { isActive: boolean },
>(items: T[], menuItemId: string | undefined, categoryId: string): T[] {
  return items.filter((item) => {
    if (!item.isActive) {
      return false;
    }

    if (
      item.scopeType === "menu_item" &&
      menuItemId &&
      item.menuItemId === menuItemId
    ) {
      return true;
    }

    return item.scopeType === "category" && item.categoryId === categoryId;
  });
}

export function filterFlowBlocksForMenuItem(
  blocks: ProductFlowBlockRecord[],
  menuItemId: string | undefined,
  categoryId: string,
) {
  return filterFlowLibraryForMenuItem(blocks, menuItemId, categoryId);
}

export function filterFlowTemplatesForMenuItem(
  templates: ProductFlowTemplateRecord[],
  menuItemId: string | undefined,
  categoryId: string,
) {
  return filterFlowLibraryForMenuItem(templates, menuItemId, categoryId);
}

function resolveStepList(
  steps: FlowStep[],
  blocksById: Map<string, ProductFlowBlockRecord>,
): ResolvedFlowStep[] {
  const resolved: ResolvedFlowStep[] = [];

  for (const step of steps) {
    if (step.kind === "block") {
      const block = blocksById.get(step.blockId);

      if (!block || !block.isActive) {
        continue;
      }

      resolved.push({
        id: step.id,
        type: block.type,
        config: mergeBlockConfig(block.config, step.overrides),
        source: "block",
        blockId: block.id,
      });
      continue;
    }

    if (step.kind === "inline") {
      resolved.push({
        id: step.id,
        type: step.type,
        config: step.config,
        source: "inline",
      });
      continue;
    }

    if (evaluateCondition(step.when, {})) {
      resolved.push(...resolveStepList(step.then, blocksById));
    }
  }

  return resolved;
}

function getSelectionValue(selection: StepSelection | undefined) {
  if (!selection) {
    return undefined;
  }

  switch (selection.type) {
    case "choice":
      return selection.optionId;
    case "multi_choice":
      return selection.optionIds;
    case "quantity":
      return selection.quantity;
    case "text":
      return selection.value;
    case "info":
      return selection.acknowledged;
    case "upsell":
      return selection.accepted;
  }
}

export function evaluateCondition(
  condition: FlowCondition,
  selections: FlowSelections,
): boolean {
  const selection = selections[condition.stepId];
  const actual = getSelectionValue(selection);

  switch (condition.operator) {
    case "equals":
      if (selection?.type === "choice") {
        return selection.optionId === condition.optionId;
      }

      return actual === condition.value;
    case "not_equals":
      if (selection?.type === "choice") {
        return selection.optionId !== condition.optionId;
      }

      return actual !== condition.value;
    case "includes":
      if (selection?.type === "multi_choice" && condition.optionId) {
        return selection.optionIds.includes(condition.optionId);
      }

      if (Array.isArray(actual) && condition.optionId) {
        return actual.includes(condition.optionId);
      }

      return false;
    case "not_includes":
      if (selection?.type === "multi_choice" && condition.optionId) {
        return !selection.optionIds.includes(condition.optionId);
      }

      if (Array.isArray(actual) && condition.optionId) {
        return !actual.includes(condition.optionId);
      }

      return true;
  }
}

export function resolveVisibleSteps(
  steps: FlowStep[],
  blocks: ProductFlowBlockRecord[],
  selections: FlowSelections,
): ResolvedFlowStep[] {
  const blocksById = new Map(blocks.map((block) => [block.id, block]));
  const visible: ResolvedFlowStep[] = [];

  function walk(stepList: FlowStep[]) {
    for (const step of stepList) {
      if (step.kind === "conditional") {
        if (evaluateCondition(step.when, selections)) {
          walk(step.then);
        }
        continue;
      }

      if (step.kind === "block") {
        const block = blocksById.get(step.blockId);

        if (!block || !block.isActive) {
          continue;
        }

        visible.push({
          id: step.id,
          type: block.type,
          config: mergeBlockConfig(block.config, step.overrides),
          source: "block",
          blockId: block.id,
        });
        continue;
      }

      visible.push({
        id: step.id,
        type: step.type,
        config: step.config,
        source: "inline",
      });
    }
  }

  walk(steps);
  return visible;
}

export function resolveAllSteps(
  steps: FlowStep[],
  blocks: ProductFlowBlockRecord[],
): ResolvedFlowStep[] {
  const blocksById = new Map(blocks.map((block) => [block.id, block]));
  return resolveStepList(steps, blocksById);
}

function getOptionPrice(option: FlowOption, priceMode: FlowPriceMode = "delta") {
  const mode = option.priceMode ?? priceMode;
  return {
    mode,
    cents: option.priceCents ?? 0,
  };
}

function formatOptionValue(
  option: FlowOption,
  locale: string,
  quantity = 1,
): string {
  const label = resolveLocalizedLabel(option.label, locale);
  return quantity > 1 ? `${label} x${quantity}` : label;
}

function computeStepPrice(
  step: ResolvedFlowStep,
  selection: StepSelection | undefined,
  locale: string,
  menuItemPrices: Map<string, number>,
): { priceCents: number; snapshots: OrderLineSelectionSnapshot[] } {
  const label = resolveLocalizedLabel(step.config.label, locale);
  const snapshots: OrderLineSelectionSnapshot[] = [];
  let priceCents = 0;

  switch (step.type) {
    case "choice": {
      if (selection?.type !== "choice") {
        break;
      }

      const option = step.config.options?.find(
        (entry) => entry.id === selection.optionId,
      );

      if (!option || option.isAvailable === false) {
        break;
      }

      const pricing = getOptionPrice(option);
      priceCents =
        pricing.mode === "override" ? pricing.cents : pricing.cents;
      snapshots.push({
        stepId: step.id,
        type: step.type,
        label,
        value: formatOptionValue(option, locale),
        priceCents,
      });
      break;
    }
    case "multi_choice": {
      if (selection?.type !== "multi_choice") {
        break;
      }

      for (const optionId of selection.optionIds) {
        const option = step.config.options?.find(
          (entry) => entry.id === optionId,
        );

        if (!option || option.isAvailable === false) {
          continue;
        }

        const pricing = getOptionPrice(option);
        const optionPrice = pricing.cents;
        priceCents += optionPrice;
        snapshots.push({
          stepId: step.id,
          type: step.type,
          label,
          value: formatOptionValue(option, locale),
          priceCents: optionPrice,
        });
      }
      break;
    }
    case "quantity": {
      if (selection?.type !== "quantity") {
        break;
      }

      const unitPrice = step.config.options?.[0]?.priceCents ?? 0;
      const total = unitPrice * selection.quantity;
      priceCents += total;
      snapshots.push({
        stepId: step.id,
        type: step.type,
        label,
        value: String(selection.quantity),
        priceCents: total,
      });
      break;
    }
    case "text": {
      if (selection?.type !== "text" || !selection.value.trim()) {
        break;
      }

      snapshots.push({
        stepId: step.id,
        type: step.type,
        label,
        value: selection.value.trim(),
        priceCents: 0,
      });
      break;
    }
    case "info": {
      if (selection?.type === "info" && selection.acknowledged) {
        snapshots.push({
          stepId: step.id,
          type: step.type,
          label,
          value: resolveLocalizedLabel(step.config.infoContent, locale),
          priceCents: 0,
        });
      }
      break;
    }
    case "upsell": {
      if (selection?.type !== "upsell" || !selection.accepted) {
        break;
      }

      const menuItemId = step.config.menuItemId;
      const upsellPrice = menuItemId
        ? (menuItemPrices.get(menuItemId) ?? 0)
        : 0;
      const total = upsellPrice * Math.max(1, selection.quantity);
      priceCents += total;
      snapshots.push({
        stepId: step.id,
        type: step.type,
        label,
        value:
          selection.quantity > 1
            ? `x${selection.quantity}`
            : resolveLocalizedLabel(step.config.label, locale),
        priceCents: total,
      });
      break;
    }
  }

  return { priceCents, snapshots };
}

export function computeFlowLinePrice(input: {
  basePriceCents: number;
  steps: FlowStep[];
  blocks: ProductFlowBlockRecord[];
  selections: FlowSelections;
  locale: string;
  menuItemPrices?: Map<string, number>;
  useOverrideBase?: boolean;
}) {
  const visibleSteps = resolveVisibleSteps(
    input.steps,
    input.blocks,
    input.selections,
  );
  const menuItemPrices = input.menuItemPrices ?? new Map<string, number>();

  let basePriceCents = input.basePriceCents;
  let modifierTotal = 0;
  const snapshots: OrderLineSelectionSnapshot[] = [];

  for (const step of visibleSteps) {
    const selection = input.selections[step.id];
    const result = computeStepPrice(
      step,
      selection,
      input.locale,
      menuItemPrices,
    );

    if (step.type === "choice" && selection?.type === "choice") {
      const option = step.config.options?.find(
        (entry) => entry.id === selection.optionId,
      );

      if (option) {
        const pricing = getOptionPrice(option);

        if (pricing.mode === "override") {
          basePriceCents = pricing.cents;
          continue;
        }
      }
    }

    modifierTotal += result.priceCents;
    snapshots.push(...result.snapshots);
  }

  return {
    computedPriceCents: basePriceCents + modifierTotal,
    selections: snapshots,
  };
}

export function validateFlowSelections(input: {
  steps: FlowStep[];
  blocks: ProductFlowBlockRecord[];
  selections: FlowSelections;
  locale: string;
}): string[] {
  const visibleSteps = resolveVisibleSteps(
    input.steps,
    input.blocks,
    input.selections,
  );
  const errors: string[] = [];

  for (const step of visibleSteps) {
    const selection = input.selections[step.id];
    const label = resolveLocalizedLabel(step.config.label, input.locale);

    if (step.config.required !== false && step.type !== "info") {
      if (!selection) {
        errors.push(label);
        continue;
      }
    }

    switch (step.type) {
      case "choice": {
        if (step.config.required === false && !selection) {
          break;
        }

        if (selection?.type !== "choice") {
          errors.push(label);
          break;
        }

        const option = step.config.options?.find(
          (entry) => entry.id === selection.optionId,
        );

        if (!option || option.isAvailable === false) {
          errors.push(label);
        }
        break;
      }
      case "multi_choice": {
        const optionIds =
          selection?.type === "multi_choice" ? selection.optionIds : [];
        const min = step.config.minSelections ?? (step.config.required === false ? 0 : 1);
        const max = step.config.maxSelections ?? Number.POSITIVE_INFINITY;

        if (optionIds.length < min || optionIds.length > max) {
          errors.push(label);
        }
        break;
      }
      case "quantity": {
        const quantity =
          selection?.type === "quantity"
            ? selection.quantity
            : (step.config.defaultQuantity ?? step.config.minQuantity ?? 0);
        const min = step.config.minQuantity ?? 0;
        const max = step.config.maxQuantity ?? 99;

        if (quantity < min || quantity > max) {
          errors.push(label);
        }
        break;
      }
      case "text": {
        if (step.config.required === false) {
          break;
        }

        if (selection?.type !== "text" || !selection.value.trim()) {
          errors.push(label);
        }
        break;
      }
      case "info": {
        if (step.config.required !== false) {
          if (selection?.type !== "info" || !selection.acknowledged) {
            errors.push(label);
          }
        }
        break;
      }
      case "upsell":
        break;
    }
  }

  return errors;
}

export function buildCustomizationSnapshot(input: {
  flowId: string;
  flowVersion: number;
  basePriceCents: number;
  productName: string;
  steps: FlowStep[];
  blocks: ProductFlowBlockRecord[];
  selections: FlowSelections;
  locale: string;
  menuItemPrices?: Map<string, number>;
}): OrderLineCustomization {
  const pricing = computeFlowLinePrice({
    basePriceCents: input.basePriceCents,
    steps: input.steps,
    blocks: input.blocks,
    selections: input.selections,
    locale: input.locale,
    menuItemPrices: input.menuItemPrices,
  });

  const modifierSummary = pricing.selections
    .filter((entry) => entry.priceCents > 0 || entry.type === "text")
    .map((entry) => entry.value)
    .filter(Boolean);

  const displaySummary =
    modifierSummary.length > 0 ? modifierSummary.join(", ") : "";

  return {
    flowId: input.flowId,
    flowVersion: input.flowVersion,
    basePriceCents: input.basePriceCents,
    selections: pricing.selections,
    computedPriceCents: pricing.computedPriceCents,
    displaySummary,
  };
}

export function buildCustomizedLineName(
  productName: string,
  customization: OrderLineCustomization,
) {
  if (!customization.displaySummary) {
    return productName;
  }

  return `${productName} (${customization.displaySummary})`;
}

export function createDefaultSelection(
  step: ResolvedFlowStep,
): StepSelection | undefined {
  switch (step.type) {
    case "choice": {
      const defaultOption = step.config.options?.find(
        (option) => option.isDefault,
      );
      const firstAvailable = step.config.options?.find(
        (option) => option.isAvailable !== false,
      );
      const optionId = defaultOption?.id ?? firstAvailable?.id;

      return optionId ? { type: "choice", optionId } : undefined;
    }
    case "multi_choice":
      return { type: "multi_choice", optionIds: [] };
    case "quantity":
      return {
        type: "quantity",
        quantity:
          step.config.defaultQuantity ?? step.config.minQuantity ?? 0,
      };
    case "text":
      return { type: "text", value: "" };
    case "info":
      return { type: "info", acknowledged: false };
    case "upsell":
      return { type: "upsell", accepted: false, quantity: 1 };
  }
}

export function createInitialSelections(
  steps: FlowStep[],
  blocks: ProductFlowBlockRecord[],
): FlowSelections {
  const resolved = resolveAllSteps(steps, blocks);
  const selections: FlowSelections = {};

  for (const step of resolved) {
    const defaultSelection = createDefaultSelection(step);

    if (defaultSelection) {
      selections[step.id] = defaultSelection;
    }
  }

  return selections;
}
