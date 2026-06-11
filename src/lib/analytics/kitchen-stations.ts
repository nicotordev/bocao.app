import "server-only";

import type { KitchenStationCategory } from "@/generated/prisma/client";
import type { KitchenStation } from "@/lib/kitchen/types";
import { prisma } from "@/lib/prisma";

const categoryToKitchenStation: Partial<
  Record<KitchenStationCategory, KitchenStation>
> = {
  GRILL: "grill",
  FRYER: "fryer",
  SUSHI: "sushi",
  BAR: "bar",
  DESSERTS: "desserts",
  DELIVERY: "delivery_station",
};

export async function fetchKitchenStationLabelMap(
  restaurantId: string,
  fallbackLabels: Record<string, string>,
): Promise<Record<string, string>> {
  const stations = await prisma.kitchenStation.findMany({
    where: { restaurantId, isActive: true },
    select: {
      name: true,
      category: true,
      customCategoryLabel: true,
    },
    orderBy: { sortOrder: "asc" },
  });

  const labels = { ...fallbackLabels };

  for (const station of stations) {
    const key = categoryToKitchenStation[station.category];

    if (!key || labels[key]) {
      continue;
    }

    if (station.category === "OTHER" && station.customCategoryLabel?.trim()) {
      labels[key] = station.customCategoryLabel.trim();
      continue;
    }

    labels[key] = station.name;
  }

  return labels;
}

export function formatKitchenStationLabel(
  stationKey: string,
  labelMap: Record<string, string>,
): string {
  return labelMap[stationKey] ?? stationKey.replaceAll("_", " ");
}
