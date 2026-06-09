"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ApiError } from "@/lib/query/api-client";
import { useKitchenStationMutations } from "@/lib/query/kitchen/stations.mutations";
import { useKitchenStationsQuery } from "@/lib/query/kitchen/stations.queries";
import type { KitchenStationWithStats } from "@/lib/kitchen/stations/types";
import { KitchenStationFormDialog } from "./kitchen-station-form-dialog";
import { KitchenStationsEmptyState } from "./kitchen-stations-empty-state";
import { KitchenStationsHeader } from "./kitchen-stations-header";
import { KitchenStationsList } from "./kitchen-stations-list";
import type { KitchenStationsLabels } from "./types";

type KitchenStationsPageClientProps = {
  labels: KitchenStationsLabels;
  restaurantId: string;
  canEdit: boolean;
};

export function KitchenStationsPageClient({
  labels,
  restaurantId,
  canEdit,
}: KitchenStationsPageClientProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingStation, setEditingStation] =
    useState<KitchenStationWithStats | null>(null);

  const { data, isLoading } = useKitchenStationsQuery(restaurantId);
  const {
    createMutation,
    updateMutation,
    toggleActiveMutation,
    reorderMutation,
    deleteMutation,
  } = useKitchenStationMutations(restaurantId);

  const stations = useMemo(
    () =>
      [...(data?.stations ?? [])].sort(
        (left, right) => left.sortOrder - right.sortOrder,
      ),
    [data?.stations],
  );

  const isMutating =
    createMutation.isPending ||
    updateMutation.isPending ||
    toggleActiveMutation.isPending ||
    reorderMutation.isPending ||
    deleteMutation.isPending;

  function openCreateDialog() {
    setEditingStation(null);
    setDialogOpen(true);
  }

  function openEditDialog(station: KitchenStationWithStats) {
    setEditingStation(station);
    setDialogOpen(true);
  }

  async function handleSubmit(values: {
    name: string;
    description: string;
    category: KitchenStationWithStats["category"];
    customCategoryLabel: string | null;
    imageUrl: string | null;
    iconId: KitchenStationWithStats["iconId"];
    isActive: boolean;
    sortOrder?: number;
  }) {
    try {
      if (editingStation) {
        await updateMutation.mutateAsync({
          stationId: editingStation.id,
          input: values,
        });
        toast.success(labels.feedback.updateSuccess);
      } else {
        await createMutation.mutateAsync(values);
        toast.success(labels.feedback.createSuccess);
      }
    } catch (error) {
      toast.error(labels.feedback.error);
      throw error;
    }
  }

  async function handleToggleActive(station: KitchenStationWithStats) {
    try {
      await toggleActiveMutation.mutateAsync(station.id);
      toast.success(labels.feedback.toggleSuccess);
    } catch {
      toast.error(labels.feedback.error);
    }
  }

  async function handleMove(
    station: KitchenStationWithStats,
    direction: "up" | "down",
  ) {
    try {
      await reorderMutation.mutateAsync({ stationId: station.id, direction });
    } catch {
      toast.error(labels.feedback.error);
    }
  }

  async function handleDelete(station: KitchenStationWithStats) {
    if (station.activeOrderCount > 0) {
      toast.error(labels.feedback.deleteBlocked);
      return;
    }

    if (!window.confirm(labels.form.confirmDelete)) {
      return;
    }

    try {
      await deleteMutation.mutateAsync(station.id);
      toast.success(labels.feedback.deleteSuccess);
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        toast.error(labels.feedback.deleteBlocked);
        return;
      }

      toast.error(labels.feedback.error);
    }
  }

  return (
    <main className="flex flex-col gap-6 p-4 md:p-6">
      <KitchenStationsHeader
        labels={labels.header}
        onCreate={openCreateDialog}
        canEdit={canEdit}
      />

      {isLoading ? (
        <p className="text-sm text-muted-foreground">{labels.loading}</p>
      ) : stations.length === 0 ? (
        <KitchenStationsEmptyState
          labels={labels.empty}
          onCreate={canEdit ? openCreateDialog : () => undefined}
        />
      ) : (
        <KitchenStationsList
          stations={stations}
          labels={labels}
          canEdit={canEdit}
          onEdit={openEditDialog}
          onToggleActive={handleToggleActive}
          onDelete={handleDelete}
          onMove={handleMove}
          isMutating={isMutating}
        />
      )}

      {canEdit ? (
        <KitchenStationFormDialog
          labels={labels}
          restaurantId={restaurantId}
          station={editingStation}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onSubmit={handleSubmit}
          isSubmitting={createMutation.isPending || updateMutation.isPending}
        />
      ) : null}
    </main>
  );
}
