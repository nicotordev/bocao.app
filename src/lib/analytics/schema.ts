import { z } from "zod";

export const analyticsChannelSchema = z.enum([
  "pos",
  "whatsapp",
  "web",
  "delivery",
  "manual",
]);

export const analyticsOrderStatusSchema = z.enum([
  "all",
  "confirmed",
  "completed",
  "cancelled",
]);

export const analyticsDatePresetSchema = z.enum([
  "today",
  "yesterday",
  "last7days",
  "last30days",
  "thisMonth",
  "lastMonth",
  "custom",
]);

const MAX_RANGE_DAYS = 366;

export const analyticsQuerySchema = z
  .object({
    from: z.coerce.date(),
    to: z.coerce.date(),
    channel: z.union([analyticsChannelSchema, z.literal("all")]).optional(),
    status: analyticsOrderStatusSchema.optional(),
  })
  .superRefine((value, ctx) => {
    if (value.from > value.to) {
      ctx.addIssue({
        code: "custom",
        path: ["from"],
        message: "`from` must be less than or equal to `to`",
      });
    }

    const rangeMs = value.to.getTime() - value.from.getTime();
    const maxRangeMs = MAX_RANGE_DAYS * 24 * 60 * 60 * 1000;

    if (rangeMs > maxRangeMs) {
      ctx.addIssue({
        code: "custom",
        path: ["to"],
        message: `Date range cannot exceed ${MAX_RANGE_DAYS} days`,
      });
    }
  });

export const analyticsRestaurantParamsSchema = z.object({
  restaurantId: z.string().cuid(),
});
