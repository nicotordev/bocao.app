"use client";

import { useTranslations } from "next-intl";
import { IconRefresh } from "@tabler/icons-react";
import { cn } from "@/lib/utils";

type StaleDataBannerProps = {
  isFetching: boolean;
  isPending: boolean;
  isStale: boolean;
  className?: string;
};

export function StaleDataBanner({
  isFetching,
  isPending,
  isStale,
  className,
}: StaleDataBannerProps) {
  const t = useTranslations("query");

  if (isPending) {
    return null;
  }

  if (isFetching) {
    return (
      <div
        className={cn(
          "mb-3 flex items-center gap-2 rounded-2xl border border-border/70 bg-muted/30 px-3 py-2 text-xs text-muted-foreground",
          className,
        )}
        role="status"
        aria-live="polite"
      >
        <IconRefresh className="size-3.5 animate-spin" aria-hidden />
        {t("refreshing")}
      </div>
    );
  }

  if (isStale) {
    return (
      <p
        className={cn("mb-3 text-xs text-muted-foreground", className)}
        role="status"
      >
        {t("stale")}
      </p>
    );
  }

  return null;
}
