import { z } from "zod";
import { isValidContentLocaleCode } from "@/i18n/iso-languages";
import { FLOW_BLOCK_TYPES } from "./types";

const contentLocaleKeySchema = z
  .string()
  .trim()
  .refine((value) => isValidContentLocaleCode(value), {
    message: "Invalid ISO locale code",
  });

const localizedLabelSchema = z
  .record(contentLocaleKeySchema, z.string().trim())
  .refine(
    (value) => Object.values(value).some((entry) => entry && entry.length > 0),
    { message: "At least one locale label is required" },
  );

const flowOptionSchema = z.object({
  id: z.string().min(1),
  label: localizedLabelSchema,
  priceCents: z.number().int().min(0).optional(),
  priceMode: z.enum(["delta", "override"]).optional(),
  isDefault: z.boolean().optional(),
  isAvailable: z.boolean().optional(),
  menuItemId: z.string().cuid().optional(),
});

const flowBlockConfigSchema = z.object({
  label: localizedLabelSchema,
  description: localizedLabelSchema.optional(),
  required: z.boolean().optional(),
  options: z.array(flowOptionSchema).optional(),
  minSelections: z.number().int().min(0).optional(),
  maxSelections: z.number().int().min(1).optional(),
  minQuantity: z.number().int().min(0).optional(),
  maxQuantity: z.number().int().min(1).optional(),
  defaultQuantity: z.number().int().min(0).optional(),
  placeholder: localizedLabelSchema.optional(),
  infoContent: localizedLabelSchema.optional(),
  menuItemId: z.string().cuid().optional(),
});

const flowConditionSchema: z.ZodType<{
  stepId: string;
  operator: "equals" | "not_equals" | "includes" | "not_includes";
  optionId?: string;
  value?: string | number | boolean;
}> = z.object({
  stepId: z.string().min(1),
  operator: z.enum(["equals", "not_equals", "includes", "not_includes"]),
  optionId: z.string().min(1).optional(),
  value: z.union([z.string(), z.number(), z.boolean()]).optional(),
});

const flowStepSchema: z.ZodType<import("./types").FlowStep> = z.lazy(() =>
  z.discriminatedUnion("kind", [
    z.object({
      kind: z.literal("block"),
      id: z.string().min(1),
      blockId: z.string().cuid(),
      overrides: flowBlockConfigSchema.partial().optional(),
    }),
    z.object({
      kind: z.literal("inline"),
      id: z.string().min(1),
      type: z.enum(FLOW_BLOCK_TYPES),
      config: flowBlockConfigSchema,
    }),
    z.object({
      kind: z.literal("conditional"),
      id: z.string().min(1),
      when: flowConditionSchema,
      then: z.array(flowStepSchema).min(1),
    }),
  ]),
);

export const flowLibraryScopeSchema = z.discriminatedUnion("scopeType", [
  z.object({
    scopeType: z.literal("category"),
    categoryId: z.string().cuid(),
  }),
  z.object({
    scopeType: z.literal("menu_item"),
    menuItemId: z.string().cuid(),
  }),
]);

export const flowLibraryScopeUpdateSchema = z.object({
  scopeType: z.enum(["category", "menu_item"]).optional(),
  categoryId: z.string().cuid().optional(),
  menuItemId: z.string().cuid().optional(),
});

export const createFlowBlockSchema = z
  .object({
    restaurantId: z.string().cuid(),
    key: z
      .string()
      .trim()
      .min(1)
      .max(64)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    type: z.enum(FLOW_BLOCK_TYPES),
    config: flowBlockConfigSchema,
  })
  .and(flowLibraryScopeSchema);

export const updateFlowBlockSchema = z
  .object({
    restaurantId: z.string().cuid(),
    blockId: z.string().cuid(),
    key: z
      .string()
      .trim()
      .min(1)
      .max(64)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
      .optional(),
    type: z.enum(FLOW_BLOCK_TYPES).optional(),
    config: flowBlockConfigSchema.optional(),
    isActive: z.boolean().optional(),
  })
  .and(flowLibraryScopeUpdateSchema);

export const deleteFlowBlockSchema = z.object({
  restaurantId: z.string().cuid(),
  blockId: z.string().cuid(),
});

export const createFlowTemplateSchema = z
  .object({
    restaurantId: z.string().cuid(),
    name: z.string().trim().min(1).max(120),
    description: z.string().trim().max(500).optional(),
    steps: z.array(flowStepSchema),
  })
  .and(flowLibraryScopeSchema);

export const updateFlowTemplateSchema = z
  .object({
    restaurantId: z.string().cuid(),
    templateId: z.string().cuid(),
    name: z.string().trim().min(1).max(120).optional(),
    description: z.string().trim().max(500).nullable().optional(),
    steps: z.array(flowStepSchema).optional(),
    isActive: z.boolean().optional(),
  })
  .and(flowLibraryScopeUpdateSchema);

export const deleteFlowTemplateSchema = z.object({
  restaurantId: z.string().cuid(),
  templateId: z.string().cuid(),
});

export const upsertProductFlowSchema = z.object({
  restaurantId: z.string().cuid(),
  menuItemId: z.string().cuid(),
  isActive: z.boolean(),
  steps: z.array(flowStepSchema),
});

export const deleteProductFlowSchema = z.object({
  restaurantId: z.string().cuid(),
  menuItemId: z.string().cuid(),
});

const stepSelectionSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("choice"),
    optionId: z.string().min(1),
  }),
  z.object({
    type: z.literal("multi_choice"),
    optionIds: z.array(z.string().min(1)),
  }),
  z.object({
    type: z.literal("quantity"),
    quantity: z.number().int().min(0),
  }),
  z.object({
    type: z.literal("text"),
    value: z.string(),
  }),
  z.object({
    type: z.literal("info"),
    acknowledged: z.boolean(),
  }),
  z.object({
    type: z.literal("upsell"),
    accepted: z.boolean(),
    quantity: z.number().int().min(0),
  }),
]);

export const orderLineCustomizationSchema = z.object({
  flowId: z.string().cuid(),
  flowVersion: z.number().int().min(1),
  basePriceCents: z.number().int().min(0),
  selections: z.array(
    z.object({
      stepId: z.string().min(1),
      type: z.enum(FLOW_BLOCK_TYPES),
      label: z.string().min(1),
      value: z.string(),
      priceCents: z.number().int(),
    }),
  ),
  computedPriceCents: z.number().int().min(0),
  displaySummary: z.string(),
});

export {
  flowBlockConfigSchema,
  flowStepSchema,
  localizedLabelSchema,
  stepSelectionSchema,
};
