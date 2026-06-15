import "server-only";

import { zodTextFormat } from "openai/helpers/zod";
import {
  getCustomersModel,
  getOpenAIClient,
} from "@/lib/ai/openai-client";
import { buildCustomerSmartSegmentPromptRows } from "@/lib/customers/smart-segments/build-payload";
import { computeRuleBasedSmartSegments } from "@/lib/customers/smart-segments/compute-smart-segments";
import type { CustomerListItem } from "@/lib/customers/types";
import type { CustomerSmartSegment } from "@/lib/customers/smart-segments/types";
import { customerSmartSegmentsResponseSchema } from "@/lib/customers/smart-segments/ai/schema";

type GenerateCustomerSmartSegmentsInput = {
  restaurantName: string;
  locale: string;
  currency: string;
  customers: CustomerListItem[];
};

export type GeneratedCustomerSmartSegments = {
  segments: CustomerSmartSegment[];
  source: "ai" | "rules";
};

function buildSystemPrompt(locale: string): string {
  const language = locale === "es" ? "Spanish" : "English";

  return `You are a restaurant CRM analyst for Bocao.app.
Create ${language} audience segments that are actionable for marketing and retention campaigns.
Use only the provided customer metrics and assign each customer ID to at most one segment.
Prefer 3 to 6 segments with clear names and short descriptions.
Do not invent customers, channels, or metrics that are not in the data.
Each segment must include at least one valid customer ID from the payload.
Respond only with valid JSON matching the required schema.`;
}

function buildUserPrompt(input: GenerateCustomerSmartSegmentsInput): string {
  const rows = buildCustomerSmartSegmentPromptRows(input.customers);
  const totalCustomers = input.customers.length;

  const payload = {
    restaurant: input.restaurantName,
    currency: input.currency,
    totalCustomers,
    customersInPayload: rows.length,
    customers: rows,
  };

  return [
    "Analyze the following restaurant customer base and propose smart audience segments.",
    JSON.stringify(payload, null, 2),
  ].join("\n\n");
}

function sanitizeAiSegments(
  segments: CustomerSmartSegment[],
  validCustomerIds: Set<string>,
): CustomerSmartSegment[] {
  const assigned = new Set<string>();

  return segments
    .map((segment) => {
      const customerIds = segment.customerIds.filter((customerId) => {
        if (!validCustomerIds.has(customerId) || assigned.has(customerId)) {
          return false;
        }

        assigned.add(customerId);
        return true;
      });

      if (customerIds.length === 0) {
        return null;
      }

      return {
        ...segment,
        customerIds,
      };
    })
    .filter((segment): segment is CustomerSmartSegment => segment !== null);
}

export async function generateCustomerSmartSegments(
  input: GenerateCustomerSmartSegmentsInput,
): Promise<GeneratedCustomerSmartSegments> {
  if (input.customers.length === 0) {
    return { segments: [], source: "rules" };
  }

  const validCustomerIds = new Set(input.customers.map((customer) => customer.id));
  const fallback = (): GeneratedCustomerSmartSegments => ({
    segments: computeRuleBasedSmartSegments(input.customers, input.locale),
    source: "rules",
  });

  try {
    const client = getOpenAIClient();
    const response = await client.responses.parse({
      model: getCustomersModel(),
      instructions: buildSystemPrompt(input.locale),
      input: buildUserPrompt(input),
      text: {
        format: zodTextFormat(
          customerSmartSegmentsResponseSchema,
          "customer_smart_segments",
        ),
      },
    });

    const parsed = response.output_parsed;

    if (parsed?.segments?.length) {
      const sanitized = sanitizeAiSegments(parsed.segments, validCustomerIds);

      if (sanitized.length > 0) {
        return { segments: sanitized, source: "ai" };
      }
    }

    const fallbackText = response.output_text?.trim();

    if (fallbackText) {
      try {
        const json = JSON.parse(fallbackText) as unknown;
        const validated = customerSmartSegmentsResponseSchema.safeParse(json);

        if (validated.success) {
          const sanitized = sanitizeAiSegments(
            validated.data.segments,
            validCustomerIds,
          );

          if (sanitized.length > 0) {
            return { segments: sanitized, source: "ai" };
          }
        }
      } catch {
        // use rule-based fallback below
      }
    }
  } catch {
    // OpenAI unavailable or misconfigured — use rule-based fallback.
  }

  return fallback();
}
