"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

const STALE_TOAST_ID = "query-stale-data";
const REFRESHING_TOAST_ID = "query-refreshing-data";

type StaleDataBannerProps = {
  isFetching: boolean;
  isPending: boolean;
  isStale: boolean;
};

export function StaleDataBanner({
  isFetching,
  isPending,
  isStale,
}: StaleDataBannerProps) {
  const t = useTranslations("query");

  useEffect(() => {
    if (isPending) {
      toast.dismiss(STALE_TOAST_ID);
      toast.dismiss(REFRESHING_TOAST_ID);
      return;
    }

    if (isFetching) {
      toast.dismiss(STALE_TOAST_ID);
      toast.loading(t("refreshing"), { id: REFRESHING_TOAST_ID });
      return;
    }

    toast.dismiss(REFRESHING_TOAST_ID);

    if (isStale) {
      toast.info(t("stale"), { id: STALE_TOAST_ID });
      return;
    }

    toast.dismiss(STALE_TOAST_ID);
  }, [isFetching, isPending, isStale, t]);

  useEffect(() => {
    return () => {
      toast.dismiss(STALE_TOAST_ID);
      toast.dismiss(REFRESHING_TOAST_ID);
    };
  }, []);

  return null;
}
