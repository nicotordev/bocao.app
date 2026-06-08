"use client";

import { useTranslations } from "next-intl";

export function HomeClientMessage() {
  const t = useTranslations("home");

  return (
    <p className="text-sm text-zinc-500 dark:text-zinc-400">
      {t("clientExample")}
    </p>
  );
}
