export const FLOW_BLOCK_TYPES = [
  "choice",
  "multi_choice",
  "quantity",
  "text",
  "info",
  "upsell",
] as const;

export type FlowBlockType = (typeof FLOW_BLOCK_TYPES)[number];

export const FLOW_LIBRARY_SCOPES = ["category", "menu_item"] as const;

export type FlowLibraryScope = (typeof FLOW_LIBRARY_SCOPES)[number];

export type FlowLibraryScopeInput =
  | { scopeType: "category"; categoryId: string }
  | { scopeType: "menu_item"; menuItemId: string };

export type FlowLibraryScopedRecord = {
  scopeType: FlowLibraryScope;
  categoryId: string | null;
  menuItemId: string | null;
};

export type ContentLocaleCode = string;

export type LocalizedLabel = Partial<Record<ContentLocaleCode, string>>;

export type FlowPriceMode = "delta" | "override";

export type FlowOption = {
  id: string;
  label: LocalizedLabel;
  priceCents?: number;
  priceMode?: FlowPriceMode;
  isDefault?: boolean;
  isAvailable?: boolean;
  menuItemId?: string;
};

export type FlowBlockConfig = {
  label: LocalizedLabel;
  description?: LocalizedLabel;
  required?: boolean;
  options?: FlowOption[];
  minSelections?: number;
  maxSelections?: number;
  minQuantity?: number;
  maxQuantity?: number;
  defaultQuantity?: number;
  placeholder?: LocalizedLabel;
  infoContent?: LocalizedLabel;
  menuItemId?: string;
};

export type FlowConditionOperator =
  | "equals"
  | "not_equals"
  | "includes"
  | "not_includes";

export type FlowCondition = {
  stepId: string;
  operator: FlowConditionOperator;
  optionId?: string;
  value?: string | number | boolean;
};

export type FlowStep =
  | {
      kind: "block";
      id: string;
      blockId: string;
      overrides?: Partial<FlowBlockConfig>;
    }
  | {
      kind: "inline";
      id: string;
      type: FlowBlockType;
      config: FlowBlockConfig;
    }
  | {
      kind: "conditional";
      id: string;
      when: FlowCondition;
      then: FlowStep[];
    };

export type ResolvedFlowStep = {
  id: string;
  type: FlowBlockType;
  config: FlowBlockConfig;
  source: "block" | "inline";
  blockId?: string;
};

export type ProductFlowBlockRecord = FlowLibraryScopedRecord & {
  id: string;
  key: string;
  type: FlowBlockType;
  config: FlowBlockConfig;
  sortOrder: number;
  isActive: boolean;
};

export type ProductFlowTemplateRecord = FlowLibraryScopedRecord & {
  id: string;
  name: string;
  description: string | null;
  steps: FlowStep[];
  sortOrder: number;
  isActive: boolean;
};

export type ProductPurchaseFlowRecord = {
  id: string;
  menuItemId: string;
  version: number;
  isActive: boolean;
  steps: FlowStep[];
};

export type MenuItemPurchaseFlowSummary = {
  flowId: string;
  version: number;
  isActive: boolean;
  stepCount: number;
};

export type StepSelection =
  | { type: "choice"; optionId: string }
  | { type: "multi_choice"; optionIds: string[] }
  | { type: "quantity"; quantity: number }
  | { type: "text"; value: string }
  | { type: "info"; acknowledged: boolean }
  | { type: "upsell"; accepted: boolean; quantity: number };

export type FlowSelections = Record<string, StepSelection>;

export type OrderLineSelectionSnapshot = {
  stepId: string;
  type: FlowBlockType;
  label: string;
  value: string;
  priceCents: number;
};

export type OrderLineCustomization = {
  flowId: string;
  flowVersion: number;
  basePriceCents: number;
  selections: OrderLineSelectionSnapshot[];
  computedPriceCents: number;
  displaySummary: string;
};

export type MenuItemWithFlowOption = {
  id: string;
  name: string;
  description: string | null;
  priceCents: number;
  categoryName: string;
  images: string[];
  purchaseFlow: ProductPurchaseFlowRecord | null;
  flowBlocks: ProductFlowBlockRecord[];
};
