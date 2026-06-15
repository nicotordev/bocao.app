import { getTranslations } from "next-intl/server";
import { FloorPlanPageClient } from "@/components/dashboard/floor-plan/floor-plan-page-client";
import type { FloorPlanPageLabels } from "@/components/dashboard/floor-plan/types";
import { getDashboardContext } from "@/lib/dashboard/context";
import { getFloorPlan } from "@/lib/floor-plan/repository";
import { PERMISSIONS } from "@/lib/rbac/permissions";

export default async function FloorPlanPage() {
  const t = await getTranslations("dashboard.floorPlan");
  const context = await getDashboardContext();
  const restaurantId = context?.activeRestaurant?.id ?? "";
  const permissions = context?.membership.permissions ?? [];
  const canEdit =
    permissions.includes(PERMISSIONS.RESTAURANT_WRITE) ||
    permissions.includes(PERMISSIONS.ORDERS_WRITE);
  const canView = canEdit;

  const floorPlan = restaurantId ? await getFloorPlan(restaurantId) : null;

  const labels: FloorPlanPageLabels = {
    header: {
      title: t("header.title"),
      subtitle: t("header.subtitle"),
    },
    empty: {
      title: t("empty.title"),
      description: t("empty.description"),
      cta: t("empty.cta"),
    },
    manager: {
      editLayout: t("manager.editLayout"),
      legendFree: t("manager.legendFree"),
      legendOccupied: t("manager.legendOccupied"),
      legendSelected: t("manager.legendSelected"),
      surfaceArea: t("manager.surfaceArea"),
      tableCount: t("manager.tableCount"),
      floor: t("manager.floor"),
      newOrderForTable: t("manager.newOrderForTable"),
      expandCanvas: t("manager.expandCanvas"),
      collapseCanvas: t("manager.collapseCanvas"),
      openSettingsPanel: t("manager.openSettingsPanel"),
      switchFloor: t("manager.switchFloor"),
      selectSurface: t("manager.selectSurface"),
      unconfiguredFloor: t.raw("manager.unconfiguredFloor"),
    },
    builder: {
      title: t("builder.title"),
      description: t("builder.description"),
      surfaceName: t("builder.surfaceName"),
      surfaceNamePlaceholder: t("builder.surfaceNamePlaceholder"),
      floor: t("builder.floor"),
      floorPlaceholder: t("builder.floorPlaceholder"),
      floorHint: t("builder.floorHint"),
      surfaceNameBasement: t.raw("builder.surfaceNameBasement"),
      surfaceNameGround: t("builder.surfaceNameGround"),
      surfaceNameFloor: t.raw("builder.surfaceNameFloor"),
      addSurface: t("builder.addSurface"),
      surfaceAreaM2: t("builder.surfaceAreaM2"),
      surfaceAreaPlaceholder: t("builder.surfaceAreaPlaceholder"),
      toolBoundary: t("builder.toolBoundary"),
      toolTables: t("builder.toolTables"),
      dragTableLabel: t("builder.dragTableLabel"),
      dragGuideTitle: t("builder.dragGuideTitle"),
      dragGuideDescription: t("builder.dragGuideDescription"),
      dragGuideDismiss: t("builder.dragGuideDismiss"),
      tablesModeGuideTitle: t("builder.tablesModeGuideTitle"),
      tablesModeGuideDescription: t("builder.tablesModeGuideDescription"),
      tablesModeGuideDismiss: t("builder.tablesModeGuideDismiss"),
      removeTable: t("builder.removeTable"),
      tableNumber: t("builder.tableNumber"),
      tableCapacity: t("builder.tableCapacity"),
      tableShapeRound: t("builder.tableShapeRound"),
      tableShapeSquare: t("builder.tableShapeSquare"),
      tableShapeRect: t("builder.tableShapeRect"),
      resetBoundary: t("builder.resetBoundary"),
      undoVertex: t("builder.undoVertex"),
      removeVertex: t("builder.removeVertex"),
      save: t("builder.save"),
      saving: t("builder.saving"),
      cancel: t("builder.cancel"),
      boundaryHint: t("builder.boundaryHint"),
      tablesHint: t("builder.tablesHint"),
      selectedTableHint: t("builder.selectedTableHint"),
      minBoundary: t("builder.minBoundary"),
      previousShape: t("builder.previousShape"),
      nextShape: t("builder.nextShape"),
      decreaseCapacity: t("builder.decreaseCapacity"),
      increaseCapacity: t("builder.increaseCapacity"),
    },
    feedback: {
      saveSuccess: t("feedback.saveSuccess"),
      saveError: t("feedback.saveError"),
      floorLimit: t("feedback.floorLimit"),
    },
    permissions: {
      deniedTitle: t("permissions.deniedTitle"),
      deniedDescription: t("permissions.deniedDescription"),
    },
    responsive: {
      largeScreenOnlyTitle: t("responsive.largeScreenOnlyTitle"),
      largeScreenOnlyDescription: t("responsive.largeScreenOnlyDescription"),
    },
    contextMenu: {
      addTable: t("contextMenu.addTable"),
      floorUp: t("contextMenu.floorUp"),
      floorDown: t("contextMenu.floorDown"),
      tablesModeHint: t("contextMenu.tablesModeHint"),
      activateTablesMode: t("contextMenu.activateTablesMode"),
      removeVertex: t("contextMenu.removeVertex"),
      closeMenu: t("contextMenu.closeMenu"),
    },
  };

  if (!canView) {
    return (
      <main className="flex flex-col gap-6 p-4 md:p-6">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            {labels.header.title}
          </h1>
        </div>
        <p className="text-sm text-muted-foreground">
          {labels.permissions.deniedDescription}
        </p>
      </main>
    );
  }

  return (
    <FloorPlanPageClient
      labels={labels}
      restaurantId={restaurantId}
      canEdit={canEdit}
      initialSurfaces={floorPlan?.surfaces ?? []}
    />
  );
}
