import { getTranslations } from "next-intl/server";
import type { KitchenStationValidationMessages } from "@/lib/kitchen/stations/schemas";

export async function getKitchenStationValidationMessages(): Promise<KitchenStationValidationMessages> {
  const t = await getTranslations("dashboard.kitchen.stations.validation");

  return {
    name: t("name"),
    otherCategoryLabel: t("otherCategoryLabel"),
    otherCategoryLabelOnlyForOther: t("otherCategoryLabelOnlyForOther"),
    requiredFields: t("requiredFields"),
    invalidBody: t("invalidBody"),
  };
}
