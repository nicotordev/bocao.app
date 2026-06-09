import { MENU_TAG_ICON_IDS } from "@/lib/menu/tag-icons";
import { z } from "zod";

export const kitchenStationCategorySchema = z.enum([
  "grill",
  "fryer",
  "sushi",
  "bar",
  "desserts",
  "delivery",
  "prep",
  "other",
]);

export type KitchenStationValidationMessages = {
  name: string;
  otherCategoryLabel: string;
  otherCategoryLabelOnlyForOther: string;
  requiredFields: string;
  invalidBody: string;
};

const defaultValidationMessages: KitchenStationValidationMessages = {
  name: "Enter a station name.",
  otherCategoryLabel: "Specify the station type when you choose Other.",
  otherCategoryLabelOnlyForOther:
    "Custom category label is only allowed when category is Other.",
  requiredFields: "At least one field is required.",
  invalidBody: "Invalid request body.",
};

const kitchenStationImageUrlSchema = z
  .union([z.string().url().max(2048), z.literal(""), z.null()])
  .optional();

const kitchenStationIconIdSchema = z
  .union([z.enum(MENU_TAG_ICON_IDS), z.literal(""), z.null()])
  .optional();

const kitchenStationCustomCategoryLabelSchema = z
  .string()
  .trim()
  .max(40)
  .optional()
  .nullable();

function createValidateCustomCategoryLabel(
  messages: KitchenStationValidationMessages,
) {
  return <
    T extends {
      category: z.infer<typeof kitchenStationCategorySchema>;
      customCategoryLabel?: string | null;
    },
  >(
    data: T,
    ctx: z.RefinementCtx,
  ) => {
    const trimmed = data.customCategoryLabel?.trim();

    if (data.category === "other" && !trimmed) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["customCategoryLabel"],
        message: messages.otherCategoryLabel,
      });
    }

    if (data.category !== "other" && trimmed) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["customCategoryLabel"],
        message: messages.otherCategoryLabelOnlyForOther,
      });
    }
  };
}

export function createKitchenStationBodySchema(
  messages: KitchenStationValidationMessages = defaultValidationMessages,
) {
  return z
    .object({
      name: z.string().trim().min(1, messages.name).max(80),
      description: z.string().trim().max(240).optional().default(""),
      category: kitchenStationCategorySchema,
      customCategoryLabel: kitchenStationCustomCategoryLabelSchema,
      imageUrl: kitchenStationImageUrlSchema,
      iconId: kitchenStationIconIdSchema,
      isActive: z.boolean().optional().default(true),
      sortOrder: z.number().int().min(0).optional(),
    })
    .superRefine(createValidateCustomCategoryLabel(messages));
}

export function createUpdateKitchenStationBodySchema(
  messages: KitchenStationValidationMessages = defaultValidationMessages,
) {
  return z
    .object({
      name: z.string().trim().min(1, messages.name).max(80).optional(),
      description: z.string().trim().max(240).optional(),
      category: kitchenStationCategorySchema.optional(),
      customCategoryLabel: kitchenStationCustomCategoryLabelSchema,
      imageUrl: kitchenStationImageUrlSchema,
      iconId: kitchenStationIconIdSchema,
      isActive: z.boolean().optional(),
      sortOrder: z.number().int().min(0).optional(),
    })
    .refine((value) => Object.keys(value).length > 0, {
      message: messages.requiredFields,
    });
}

export const kitchenStationCreateBodySchema = createKitchenStationBodySchema();
export const kitchenStationUpdateBodySchema =
  createUpdateKitchenStationBodySchema();

export const reorderKitchenStationBodySchema = z.object({
  direction: z.enum(["up", "down"]),
});
