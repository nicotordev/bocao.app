import { z } from "zod";

export const CAMPAIGN_GOALS = [
  "increase_sales",
  "reactivate_customers",
  "promote_dish",
  "fill_slow_hours",
  "announce_event",
  "birthday_campaign",
  "other",
] as const;

export const MARKETING_CHANNELS = [
  "whatsapp",
  "instagram",
  "email",
  "sms",
] as const;

export const MARKETING_TONES = [
  "friendly",
  "elegant",
  "playful",
  "urgent",
  "premium",
  "family",
] as const;

export const MARKETING_AUDIENCES = [
  "all_customers",
  "frequent_customers",
  "inactive_customers",
  "new_customers",
  "custom_segment",
] as const;

export const generateMarketingCopyInputSchema = z.object({
  campaignGoal: z.enum(CAMPAIGN_GOALS),
  channel: z.enum(MARKETING_CHANNELS),
  tone: z.enum(MARKETING_TONES),
  audience: z.enum(MARKETING_AUDIENCES),
  productName: z.string().trim().max(200).optional(),
  promotion: z.string().trim().max(500).optional(),
  extraInstructions: z.string().trim().max(1000).optional(),
});

export const generatedMarketingCampaignSchema = z.object({
  title: z.string(),
  mainMessage: z.string(),
  alternatives: z.array(z.string()),
  callToAction: z.string(),
  hashtags: z.array(z.string()),
  shortVersion: z.string(),
  sendingRecommendation: z.string(),
});

export type GenerateMarketingCopyInput = z.infer<
  typeof generateMarketingCopyInputSchema
>;

export type GeneratedMarketingCampaign = z.infer<
  typeof generatedMarketingCampaignSchema
>;
