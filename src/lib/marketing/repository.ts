import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import type {
  CampaignSource,
  GenerateMarketingCopyInput,
  GeneratedMarketingCampaign,
} from "@/lib/marketing/ai/schema";
import type { MarketingCampaignRecord } from "@/lib/marketing/ai/types";
import {
  CAMPAIGN_SOURCES,
  generatedMarketingCampaignSchema,
} from "@/lib/marketing/ai/schema";
import { z } from "zod";

async function getRestaurantOrganizationId(restaurantId: string) {
  const restaurant = await prisma.restaurant.findUnique({
    where: { id: restaurantId },
    select: { organizationId: true },
  });

  if (!restaurant) {
    throw new Error("RESTAURANT_NOT_FOUND");
  }

  return restaurant.organizationId;
}

const campaignInputSourceSchema = z.object({
  source: z.enum(CAMPAIGN_SOURCES).optional(),
});

function parseCampaignSource(input: Prisma.JsonValue): CampaignSource {
  const parsed = campaignInputSourceSchema.safeParse(input);
  return parsed.success && parsed.data.source ? parsed.data.source : "ai";
}

function mapCampaignRecord(campaign: {
  id: string;
  goal: string;
  channel: string;
  tone: string;
  audience: string;
  productName: string | null;
  promotion: string | null;
  status: string;
  input: Prisma.JsonValue;
  output: Prisma.JsonValue;
  createdAt: Date;
}): MarketingCampaignRecord | null {
  const parsedOutput = generatedMarketingCampaignSchema.safeParse(
    campaign.output,
  );

  if (!parsedOutput.success) {
    return null;
  }

  return {
    id: campaign.id,
    goal: campaign.goal,
    channel: campaign.channel,
    tone: campaign.tone,
    audience: campaign.audience,
    productName: campaign.productName,
    promotion: campaign.promotion,
    status: campaign.status,
    source: parseCampaignSource(campaign.input),
    output: parsedOutput.data,
    createdAt: campaign.createdAt.toISOString(),
  };
}

export async function listMarketingCampaigns(
  restaurantId: string,
  options?: { limit?: number },
): Promise<MarketingCampaignRecord[]> {
  const tenantId = await getRestaurantOrganizationId(restaurantId);
  const limit = options?.limit ?? 20;

  const campaigns = await prisma.marketingCampaign.findMany({
    where: { restaurantId, tenantId },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      goal: true,
      channel: true,
      tone: true,
      audience: true,
      productName: true,
      promotion: true,
      status: true,
      input: true,
      output: true,
      createdAt: true,
    },
  });

  return campaigns
    .map((campaign) => mapCampaignRecord(campaign))
    .filter(
      (campaign): campaign is MarketingCampaignRecord => campaign !== null,
    );
}

export async function saveMarketingCampaign(input: {
  restaurantId: string;
  createdById: string;
  formInput: GenerateMarketingCopyInput;
  output: GeneratedMarketingCampaign;
  status?: "draft" | "saved";
}) {
  const tenantId = await getRestaurantOrganizationId(input.restaurantId);

  return prisma.marketingCampaign.create({
    data: {
      tenantId,
      restaurantId: input.restaurantId,
      createdById: input.createdById,
      goal: input.formInput.campaignGoal,
      channel: input.formInput.channel,
      tone: input.formInput.tone,
      audience: input.formInput.audience,
      productName: input.formInput.productName ?? null,
      promotion: input.formInput.promotion ?? null,
      input: input.formInput as Prisma.InputJsonValue,
      output: input.output as Prisma.InputJsonValue,
      status: input.status ?? "saved",
    },
    select: { id: true },
  });
}

export async function getRestaurantName(restaurantId: string) {
  const restaurant = await prisma.restaurant.findUnique({
    where: { id: restaurantId },
    select: { name: true },
  });

  return restaurant?.name;
}

export async function getMenuItemForMarketing(
  restaurantId: string,
  menuItemId: string,
) {
  const item = await prisma.menuItem.findFirst({
    where: { id: menuItemId, restaurantId, isAvailable: true },
    select: {
      id: true,
      name: true,
      description: true,
      priceCents: true,
      category: { select: { name: true } },
    },
  });

  if (!item) {
    return null;
  }

  return {
    id: item.id,
    name: item.name,
    description: item.description,
    priceCents: item.priceCents,
    categoryName: item.category.name,
  };
}
