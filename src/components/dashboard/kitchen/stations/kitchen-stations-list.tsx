"use client";

import type { KitchenStationWithStats } from "@/lib/kitchen/stations/types";
import { KitchenStationCard } from "./kitchen-station-card";
import type { KitchenStationsLabels } from "./types";

type KitchenStationsListProps = {
  stations: KitchenStationWithStats[];
  labels: KitchenStationsLabels;
  canEdit: boolean;
  onEdit: (station: KitchenStationWithStats) => void;
  onToggleActive: (station: KitchenStationWithStats) => void;
  onDelete: (station: KitchenStationWithStats) => void;
  onMove: (station: KitchenStationWithStats, direction: "up" | "down") => void;
  isMutating?: boolean;
};

export function KitchenStationsList({
  stations,
  labels,
  canEdit,
  onEdit,
  onToggleActive,
  onDelete,
  onMove,
  isMutating = false,
}: KitchenStationsListProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {stations.map((station, index) => (
        <KitchenStationCard
          key={station.id}
          station={station}
          labels={labels}
          canEdit={canEdit}
          isFirst={index === 0}
          isLast={index === stations.length - 1}
          onEdit={onEdit}
          onToggleActive={onToggleActive}
          onDelete={onDelete}
          onMove={onMove}
          isMutating={isMutating}
        />
      ))}
    </div>
  );
}
