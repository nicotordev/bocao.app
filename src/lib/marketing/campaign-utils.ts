import type {
  GenerateMarketingCopyInput,
  GeneratedMarketingCampaign,
} from "@/lib/marketing/ai/schema";

export function formatCampaignDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function buildCopyText(
  campaign: GeneratedMarketingCampaign,
  channel: GenerateMarketingCopyInput["channel"],
) {
  if (channel === "sms" && campaign.shortVersion) {
    return campaign.shortVersion;
  }

  const parts = [
    campaign.title,
    "",
    campaign.mainMessage,
    "",
    campaign.callToAction,
  ];

  if (channel === "instagram" && campaign.hashtags.length > 0) {
    parts.push("", campaign.hashtags.join(" "));
  }

  return parts.join("\n").trim();
}
