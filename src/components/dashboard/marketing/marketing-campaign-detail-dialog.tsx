"use client";

import { TbCopy } from "react-icons/tb";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { buildCopyText } from "@/lib/marketing/campaign-utils";
import type { GenerateMarketingCopyInput } from "@/lib/marketing/ai/schema";
import type { MarketingCampaignRecord } from "@/lib/marketing/ai/types";
import { MarketingCampaignResult } from "./marketing-campaign-result";
import type { MarketingAiLabels } from "./types";

type MarketingCampaignDetailDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  labels: MarketingAiLabels;
  campaign: MarketingCampaignRecord | null;
};

export function MarketingCampaignDetailDialog({
  open,
  onOpenChange,
  labels,
  campaign,
}: MarketingCampaignDetailDialogProps) {
  if (!campaign) {
    return null;
  }

  const channel = campaign.channel as GenerateMarketingCopyInput["channel"];

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(
        buildCopyText(campaign.output, channel),
      );
      toast.success(labels.actions.copySuccess);
    } catch {
      toast.error(labels.errors.generic);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(90vh,820px)] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
        <DialogHeader className="border-b border-border px-6 py-5">
          <DialogTitle>{campaign.output.title}</DialogTitle>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          <MarketingCampaignResult
            labels={labels.result}
            channel={channel}
            result={campaign.output}
          />
        </div>

        <div className="flex flex-wrap gap-2 border-t border-border px-6 py-4">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => void handleCopy()}
          >
            <TbCopy className="size-4" aria-hidden />
            {labels.actions.copy}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
