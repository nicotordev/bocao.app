import type { CampaignSource, GeneratedMarketingCampaign } from "./schema";

export type {
  GenerateMarketingCopyInput,
  GeneratedMarketingCampaign,
} from "./schema";

export type MarketingCampaignRecord = {
  id: string;
  goal: string;
  channel: string;
  tone: string;
  audience: string;
  productName: string | null;
  promotion: string | null;
  status: string;
  source: CampaignSource;
  output: GeneratedMarketingCampaign;
  createdAt: string;
};
