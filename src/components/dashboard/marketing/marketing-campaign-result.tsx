"use client";

import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type {
  GenerateMarketingCopyInput,
  GeneratedMarketingCampaign,
} from "@/lib/marketing/ai/schema";
import type { MarketingAiLabels } from "./types";

type MarketingCampaignResultProps = {
  labels: MarketingAiLabels["result"];
  channel: GenerateMarketingCopyInput["channel"];
  result: GeneratedMarketingCampaign;
};

export function MarketingCampaignResult({
  labels,
  channel,
  result,
}: MarketingCampaignResultProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {labels.suggestedTitle}
        </p>
        <p className="text-lg font-semibold">{result.title}</p>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {labels.mainMessage}
        </p>
        <p className="whitespace-pre-wrap text-sm leading-relaxed">
          {result.mainMessage}
        </p>
      </div>

      {result.alternatives.length > 0 ? (
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {labels.alternatives}
          </p>
          <ul className="space-y-2">
            {result.alternatives.map((alternative) => (
              <li
                key={alternative}
                className="rounded-2xl border border-border/60 bg-background/50 px-3 py-2 text-sm"
              >
                {alternative}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {labels.callToAction}
        </p>
        <p className="text-sm font-medium">{result.callToAction}</p>
      </div>

      {channel === "instagram" && result.hashtags.length > 0 ? (
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {labels.hashtags}
          </p>
          <div className="flex flex-wrap gap-2">
            {result.hashtags.map((tag) => (
              <Badge key={tag} variant="secondary">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      ) : null}

      {channel === "sms" || result.shortVersion ? (
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {labels.shortVersion}
          </p>
          <p className="rounded-2xl border border-border/60 bg-background/50 px-3 py-2 text-sm">
            {result.shortVersion}
          </p>
        </div>
      ) : null}

      <Separator />

      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {labels.sendingRecommendation}
        </p>
        <p className="text-sm text-muted-foreground">
          {result.sendingRecommendation}
        </p>
      </div>
    </div>
  );
}
