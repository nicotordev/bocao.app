"use server";

import { revalidatePath } from "next/cache";
import {
  MarketingCopyGenerationError,
  generateMarketingCopy,
} from "@/lib/marketing/ai/generate-marketing-copy";
import {
  generateMarketingCopyInputSchema,
  generatedMarketingCampaignSchema,
  type GeneratedMarketingCampaign,
} from "@/lib/marketing/ai/schema";
import { requireRestaurantMarketingWriteAccess } from "@/lib/marketing/api-auth";
import {
  getMenuItemForMarketing,
  getRestaurantName,
  saveMarketingCampaign,
} from "@/lib/marketing/repository";

export type GenerateMarketingCampaignResult =
  | { ok: true; campaign: GeneratedMarketingCampaign }
  | { ok: false; error: string };

export type SaveMarketingCampaignResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

export async function generateMarketingCampaignAction(
  restaurantId: string,
  rawInput: unknown,
): Promise<GenerateMarketingCampaignResult> {
  const access = await requireRestaurantMarketingWriteAccess(restaurantId);

  if (!access.ok) {
    return { ok: false, error: "FORBIDDEN" };
  }

  const parsed = generateMarketingCopyInputSchema.safeParse(rawInput);

  if (!parsed.success) {
    return { ok: false, error: "INVALID_INPUT" };
  }

  try {
    const menuItem = parsed.data.menuItemId
      ? await getMenuItemForMarketing(restaurantId, parsed.data.menuItemId)
      : null;

    if (parsed.data.menuItemId && !menuItem) {
      return { ok: false, error: "INVALID_INPUT" };
    }

    const restaurantName = await getRestaurantName(restaurantId);

    const campaign = await generateMarketingCopy(parsed.data, {
      restaurantName,
      productDescription: menuItem?.description,
      productCategory: menuItem?.categoryName,
    });

    return { ok: true, campaign };
  } catch (error) {
    if (error instanceof MarketingCopyGenerationError) {
      return { ok: false, error: error.code };
    }

    return { ok: false, error: "OPENAI_FAILED" };
  }
}

export async function saveMarketingCampaignAction(
  restaurantId: string,
  rawInput: unknown,
  output: GeneratedMarketingCampaign,
): Promise<SaveMarketingCampaignResult> {
  const access = await requireRestaurantMarketingWriteAccess(restaurantId);

  if (!access.ok) {
    return { ok: false, error: "FORBIDDEN" };
  }

  const parsed = generateMarketingCopyInputSchema.safeParse(rawInput);

  if (!parsed.success) {
    return { ok: false, error: "INVALID_INPUT" };
  }

  if (parsed.data.menuItemId) {
    const menuItem = await getMenuItemForMarketing(
      restaurantId,
      parsed.data.menuItemId,
    );

    if (!menuItem) {
      return { ok: false, error: "INVALID_INPUT" };
    }
  }

  const parsedOutput = generatedMarketingCampaignSchema.safeParse(output);

  if (!parsedOutput.success) {
    return { ok: false, error: "INVALID_INPUT" };
  }

  try {
    const saved = await saveMarketingCampaign({
      restaurantId,
      createdById: access.context.user.id,
      formInput: parsed.data,
      output: parsedOutput.data,
      status: "saved",
    });

    revalidatePath("/dashboard/marketing/ai", "layout");

    return { ok: true, id: saved.id };
  } catch {
    return { ok: false, error: "SAVE_FAILED" };
  }
}
