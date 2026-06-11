import { z } from "zod";

export const analyticsInsightItemSchema = z.object({
  id: z.string().min(1).max(64),
  message: z.string().min(1).max(500),
});

export const analyticsInsightsResponseSchema = z.object({
  insights: z.array(analyticsInsightItemSchema).min(1).max(6),
});

export type AnalyticsInsightsResponse = z.infer<
  typeof analyticsInsightsResponseSchema
>;
