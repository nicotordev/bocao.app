import type {
  DiningSurfaceRecord,
  TableOccupancy,
} from "@/lib/floor-plan/types";

export type FloorPlanPageLabels = {
  header: {
    title: string;
    subtitle: string;
  };
  empty: {
    title: string;
    description: string;
    cta: string;
  };
  manager: {
    editLayout: string;
    legendFree: string;
    legendOccupied: string;
    legendSelected: string;
    surfaceArea: string;
    tableCount: string;
    floor: string;
    newOrderForTable: string;
    expandCanvas: string;
    collapseCanvas: string;
    openSettingsPanel: string;
    switchFloor: string;
    selectSurface: string;
    unconfiguredFloor: string;
  };
  builder: {
    title: string;
    description: string;
    surfaceName: string;
    surfaceNamePlaceholder: string;
    floor: string;
    floorPlaceholder: string;
    floorHint: string;
    surfaceNameBasement: string;
    surfaceNameGround: string;
    surfaceNameFloor: string;
    surfaceAreaM2: string;
    surfaceAreaPlaceholder: string;
    addSurface: string;
    toolBoundary: string;
    toolTables: string;
    dragTableLabel: string;
    dragGuideTitle: string;
    dragGuideDescription: string;
    dragGuideDismiss: string;
    tablesModeGuideTitle: string;
    tablesModeGuideDescription: string;
    tablesModeGuideDismiss: string;
    removeTable: string;
    tableNumber: string;
    tableCapacity: string;
    tableShapeRound: string;
    tableShapeSquare: string;
    tableShapeRect: string;
    resetBoundary: string;
    undoVertex: string;
    removeVertex: string;
    save: string;
    saving: string;
    cancel: string;
    boundaryHint: string;
    tablesHint: string;
    selectedTableHint: string;
    minBoundary: string;
    previousShape: string;
    nextShape: string;
    decreaseCapacity: string;
    increaseCapacity: string;
  };
  feedback: {
    saveSuccess: string;
    saveError: string;
    floorLimit: string;
  };
  permissions: {
    deniedTitle: string;
    deniedDescription: string;
  };
  contextMenu: {
    addTable: string;
    floorUp: string;
    floorDown: string;
    tablesModeHint: string;
    activateTablesMode: string;
    removeVertex: string;
    closeMenu: string;
  };
};

export type FloorPlanPageClientProps = {
  labels: FloorPlanPageLabels;
  restaurantId: string;
  canEdit: boolean;
  initialSurfaces: DiningSurfaceRecord[];
  occupiedTableNumbers: TableOccupancy;
};
