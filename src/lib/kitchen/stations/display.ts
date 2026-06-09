import type {
  KitchenStationCategory,
  KitchenStationConfig,
} from "@/lib/kitchen/stations/types";

export function getKitchenStationCategoryLabel(
  station: Pick<KitchenStationConfig, "category" | "customCategoryLabel">,
  categoryLabels: Record<KitchenStationCategory, string>,
): string {
  if (station.category === "other" && station.customCategoryLabel?.trim()) {
    return station.customCategoryLabel.trim();
  }

  return categoryLabels[station.category];
}
