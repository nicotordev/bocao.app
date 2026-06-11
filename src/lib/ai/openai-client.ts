import "server-only";

import OpenAI from "openai";

let client: OpenAI | null = null;

export function getOpenAIClient(): OpenAI {
  if (!client) {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      throw new Error("OPENAI_API_KEY_NOT_CONFIGURED");
    }

    client = new OpenAI({ apiKey });
  }

  return client;
}

export function getMarketingModel(): string {
  return process.env.OPENAI_MARKETING_MODEL ?? "gpt-4.1-mini";
}
