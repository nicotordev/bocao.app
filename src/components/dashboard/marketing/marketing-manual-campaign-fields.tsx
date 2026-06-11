"use client";

import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { ManualCampaignDraft } from "@/lib/marketing/ai/schema";
import type { MarketingAiLabels } from "./types";

type MarketingManualCampaignFieldsProps = {
  labels: MarketingAiLabels["manual"];
  channel: "whatsapp" | "instagram" | "email" | "sms";
  value: ManualCampaignDraft;
  onChange: (value: ManualCampaignDraft) => void;
};

export function MarketingManualCampaignFields({
  labels,
  channel,
  value,
  onChange,
}: MarketingManualCampaignFieldsProps) {
  const update = <K extends keyof ManualCampaignDraft>(
    key: K,
    next: ManualCampaignDraft[K],
  ) => {
    onChange({ ...value, [key]: next });
  };

  return (
    <FieldGroup>
      <Field>
        <FieldLabel>{labels.title}</FieldLabel>
        <Input
          value={value.title}
          onChange={(event) => update("title", event.target.value)}
          placeholder={labels.titlePlaceholder}
          maxLength={200}
        />
      </Field>

      <Field>
        <FieldLabel>{labels.mainMessage}</FieldLabel>
        <Textarea
          value={value.mainMessage}
          onChange={(event) => update("mainMessage", event.target.value)}
          placeholder={labels.mainMessagePlaceholder}
          maxLength={5000}
          className="min-h-32"
        />
      </Field>

      <Field>
        <FieldLabel>{labels.callToAction}</FieldLabel>
        <Input
          value={value.callToAction ?? ""}
          onChange={(event) => update("callToAction", event.target.value)}
          placeholder={labels.callToActionPlaceholder}
          maxLength={500}
        />
      </Field>

      {channel === "sms" || channel === "whatsapp" ? (
        <Field>
          <FieldLabel>{labels.shortVersion}</FieldLabel>
          <Textarea
            value={value.shortVersion ?? ""}
            onChange={(event) => update("shortVersion", event.target.value)}
            placeholder={labels.shortVersionPlaceholder}
            maxLength={500}
          />
        </Field>
      ) : null}

      {channel === "instagram" ? (
        <Field>
          <FieldLabel>{labels.hashtags}</FieldLabel>
          <Input
            value={value.hashtagsText ?? ""}
            onChange={(event) => update("hashtagsText", event.target.value)}
            placeholder={labels.hashtagsPlaceholder}
            maxLength={500}
          />
        </Field>
      ) : null}

      <Field>
        <FieldLabel>{labels.sendingRecommendation}</FieldLabel>
        <Textarea
          value={value.sendingRecommendation ?? ""}
          onChange={(event) =>
            update("sendingRecommendation", event.target.value)
          }
          placeholder={labels.sendingRecommendationPlaceholder}
          maxLength={1000}
        />
      </Field>
    </FieldGroup>
  );
}
