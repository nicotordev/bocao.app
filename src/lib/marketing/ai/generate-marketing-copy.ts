import "server-only";

import { zodTextFormat } from "openai/helpers/zod";
import { getMarketingModel, getOpenAIClient } from "@/lib/ai/openai-client";
import {
  generatedMarketingCampaignSchema,
  type GenerateMarketingCopyInput,
  type GeneratedMarketingCampaign,
} from "./schema";

const SYSTEM_PROMPT = `You are a marketing assistant for restaurants.
You write ready-to-use promotional copy in the language of the user's instructions (default: Spanish).
Do not invent specific data that was not provided (prices, dates, addresses, customer names).
Keep the requested tone throughout.
Adapt the copy to the selected channel:
- WhatsApp: brief, direct, conversational.
- Instagram: more visual language, include hashtags and a clear CTA.
- Email: include a subject line feel in the title and a structured body in the main message.
- SMS: extremely brief; the shortVersion field is the primary deliverable.
Respond only with valid JSON matching the required schema.`;

function buildUserPrompt(
  input: GenerateMarketingCopyInput,
  options?: {
    restaurantName?: string;
    productDescription?: string | null;
    productCategory?: string;
  },
): string {
  const lines = [
    `Restaurant: ${options?.restaurantName ?? "the restaurant"}`,
    `Campaign goal: ${input.campaignGoal}`,
    `Channel: ${input.channel}`,
    `Tone: ${input.tone}`,
    `Audience: ${input.audience}`,
  ];

  if (input.productName) {
    lines.push(`Product/dish: ${input.productName}`);
  }

  if (options?.productCategory) {
    lines.push(`Product category: ${options.productCategory}`);
  }

  if (options?.productDescription) {
    lines.push(`Product description: ${options.productDescription}`);
  }

  if (input.promotion) {
    lines.push(`Promotion/discount: ${input.promotion}`);
  }

  if (input.extraInstructions) {
    lines.push(`Additional instructions: ${input.extraInstructions}`);
  }

  lines.push(
    "Generate title, mainMessage, 2-3 alternatives, callToAction, hashtags (empty array if not Instagram), shortVersion, and sendingRecommendation.",
  );

  return lines.join("\n");
}

export class MarketingCopyGenerationError extends Error {
  constructor(
    message: string,
    readonly code:
      | "OPENAI_NOT_CONFIGURED"
      | "OPENAI_FAILED"
      | "INVALID_RESPONSE",
  ) {
    super(message);
    this.name = "MarketingCopyGenerationError";
  }
}

export async function generateMarketingCopy(
  input: GenerateMarketingCopyInput,
  options?: {
    restaurantName?: string;
    productDescription?: string | null;
    productCategory?: string;
  },
): Promise<GeneratedMarketingCampaign> {
  let client;

  try {
    client = getOpenAIClient();
  } catch {
    throw new MarketingCopyGenerationError(
      "OpenAI is not configured",
      "OPENAI_NOT_CONFIGURED",
    );
  }

  try {
    const response = await client.responses.parse({
      model: getMarketingModel(),
      instructions: SYSTEM_PROMPT,
      input: buildUserPrompt(input, options),
      text: {
        format: zodTextFormat(
          generatedMarketingCampaignSchema,
          "marketing_campaign",
        ),
      },
    });

    const parsed = response.output_parsed;

    if (!parsed) {
      const fallbackText = response.output_text?.trim();

      if (fallbackText) {
        try {
          const json = JSON.parse(fallbackText) as unknown;
          const validated = generatedMarketingCampaignSchema.safeParse(json);

          if (validated.success) {
            return validated.data;
          }
        } catch {
          // fall through to error below
        }
      }

      throw new MarketingCopyGenerationError(
        "Model returned an invalid response",
        "INVALID_RESPONSE",
      );
    }

    return parsed;
  } catch (error) {
    if (error instanceof MarketingCopyGenerationError) {
      throw error;
    }

    throw new MarketingCopyGenerationError(
      "Failed to generate marketing copy",
      "OPENAI_FAILED",
    );
  }
}
