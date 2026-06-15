"use client";

import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { toast } from "sonner";
import { saveFloorPlanAction } from "@/app/actions/floor-plan";
import { useDashboardFocusMode } from "@/components/dashboard/dashboard-focus-mode";
import {
  FLOOR_PLAN_CANVAS_DROP_ID,
  FloorPlanCanvasDropZone,
} from "@/components/dashboard/floor-plan/floor-plan-canvas-drop-zone";
import { FloorPlanBuilderPanel } from "@/components/dashboard/floor-plan/floor-plan-builder-panel";
import { FloorPlanTableQuickControls } from "@/components/dashboard/floor-plan/floor-plan-table-quick-controls";
import { FloorPlanCanvasContextMenu } from "@/components/dashboard/floor-plan/floor-plan-canvas-context-menu";
import { FloorPlanCanvas } from "@/components/dashboard/floor-plan/floor-plan-canvas-loader";
import { FloorPlanFloorSwitcher } from "@/components/dashboard/floor-plan/floor-plan-floor-switcher";
import {
  FLOOR_PLAN_TABLE_PALETTE_ID,
  FloorPlanTablePaletteOverlay,
} from "@/components/dashboard/floor-plan/floor-plan-table-palette";
import type { FloorPlanPageClientProps } from "@/components/dashboard/floor-plan/types";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useFloorPlanCanvasSize } from "@/hooks/use-floor-plan-canvas-size";
import { useFloorPlanUndo } from "@/hooks/use-floor-plan-undo";
import { useFloorPlanTableDragGuide } from "@/hooks/use-floor-plan-table-drag-guide";
import { useFloorPlanTablesModeGuide } from "@/hooks/use-floor-plan-tables-mode-guide";
import {
  clamp01,
  defaultRectangleBoundary,
  nextTableNumber,
} from "@/lib/floor-plan/geometry";
import {
  dismissFloorPlanTableDragGuide,
  dismissFloorPlanTablesModeGuide,
  isFloorPlanTableDragGuideDismissed,
  isFloorPlanTablesModeGuideDismissed,
} from "@/lib/floor-plan/table-palette-guide";
import {
  FLOOR_PLAN_FLOOR_MAX,
  FLOOR_PLAN_FLOOR_MIN,
} from "@/lib/floor-plan/types";
import type {
  DiningSurfaceRecord,
  DiningTableRecord,
  NormalizedPoint,
} from "@/lib/floor-plan/types";

type BuilderTool = "boundary" | "tables";

type EditorDraft = {
  surfaceId?: string;
  name: string;
  floor: number;
  surfaceAreaM2: number;
  boundary: NormalizedPoint[];
  tables: DiningTableRecord[];
};

function createTableId() {
  return crypto.randomUUID();
}

function draftFromSurface(
  surface: DiningSurfaceRecord | null,
  defaultSurfaceName: string,
): EditorDraft {
  return {
    surfaceId: surface?.id,
    name: surface?.name ?? defaultSurfaceName,
    floor: surface?.floor ?? 1,
    surfaceAreaM2: surface?.surfaceAreaM2 ?? 45,
    boundary: surface?.boundary.length
      ? surface.boundary
      : defaultRectangleBoundary(),
    tables: surface?.tables ?? [],
  };
}

function defaultSurfaceName(
  floor: number,
  labels: FloorPlanPageClientProps["labels"]["builder"],
) {
  if (floor < 0) {
    return labels.surfaceNameBasement.replace(
      "{level}",
      String(Math.abs(floor)),
    );
  }

  if (floor === 0) {
    return labels.surfaceNameGround;
  }

  return labels.surfaceNameFloor.replace("{floor}", String(floor));
}

function resolveBuilderToolForSurface(
  surface: DiningSurfaceRecord | null,
): BuilderTool {
  if (!surface) {
    return "boundary";
  }

  return "tables";
}

export function FloorPlanPageClient({
  labels,
  restaurantId,
  canEdit,
  initialSurfaces,
}: FloorPlanPageClientProps) {
  const [surfaces, setSurfaces] = useState(initialSurfaces);
  const [activeSurfaceId, setActiveSurfaceId] = useState<string | null>(
    initialSurfaces[0]?.id ?? null,
  );
  const isEditing = canEdit;
  const [isSaving, setIsSaving] = useState(false);
  const fallbackSurfaceName = labels.builder.surfaceNamePlaceholder;
  const [draft, setDraft] = useState<EditorDraft>(() =>
    draftFromSurface(initialSurfaces[0] ?? null, fallbackSurfaceName),
  );
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [selectedVertexIndex, setSelectedVertexIndex] = useState<number | null>(
    null,
  );
  const [builderTool, setBuilderTool] = useState<BuilderTool>("boundary");
  const [isPaletteDragging, setIsPaletteDragging] = useState(false);
  const isDndReady = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const canvasDropRef = useRef<HTMLDivElement | null>(null);
  const pointerRef = useRef({ x: 0, y: 0 });
  const draftRef = useRef(draft);
  const selectedTableIdRef = useRef(selectedTableId);
  const { recordHistory, undo, clearHistory } = useFloorPlanUndo<EditorDraft>();
  const { isFocused, enterFocus, exitFocus } = useDashboardFocusMode();
  const canvasSize = useFloorPlanCanvasSize(canvasContainerRef, true);

  useEffect(() => {
    return () => {
      exitFocus();
    };
  }, [exitFocus]);

  useEffect(() => {
    if (!canEdit) {
      exitFocus();
      return undefined;
    }

    const query = window.matchMedia("(min-width: 1280px)");

    function syncFocus(event: MediaQueryList | MediaQueryListEvent) {
      if (event.matches) {
        enterFocus();
      } else {
        exitFocus();
      }
    }

    syncFocus(query);
    query.addEventListener("change", syncFocus);

    return () => {
      query.removeEventListener("change", syncFocus);
    };
  }, [canEdit, enterFocus, exitFocus]);

  useEffect(() => {
    if (!isFocused) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isFocused]);

  useEffect(() => {
    draftRef.current = draft;
  }, [draft]);

  useEffect(() => {
    selectedTableIdRef.current = selectedTableId;
  }, [selectedTableId]);

  const recordCurrentHistory = useCallback(() => {
    recordHistory(draftRef.current, selectedTableIdRef.current);
  }, [recordHistory]);

  const handleUndo = useCallback(() => {
    const snapshot = undo();

    if (!snapshot) {
      return;
    }

    setDraft(snapshot.draft);
    setSelectedTableId(snapshot.selectedTableId);
    setSelectedVertexIndex(null);
  }, [undo]);

  const removeVertexAt = useCallback(
    (index: number) => {
      recordCurrentHistory();
      setDraft((current) => ({
        ...current,
        boundary: current.boundary.filter(
          (_, vertexIndex) => vertexIndex !== index,
        ),
      }));
      setSelectedVertexIndex(null);
    },
    [recordCurrentHistory],
  );

  const removeLastVertex = useCallback(() => {
    recordCurrentHistory();
    setDraft((current) => ({
      ...current,
      boundary: current.boundary.slice(0, -1),
    }));
    setSelectedVertexIndex(null);
  }, [recordCurrentHistory]);

  const removeSelectedVertex = useCallback(() => {
    if (selectedVertexIndex === null) {
      return;
    }

    removeVertexAt(selectedVertexIndex);
  }, [removeVertexAt, selectedVertexIndex]);

  useEffect(() => {
    if (!isEditing) {
      return;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (
        !(event.ctrlKey || event.metaKey) ||
        event.key !== "z" ||
        event.shiftKey
      ) {
        return;
      }

      const target = event.target;

      if (target instanceof HTMLElement) {
        const tag = target.tagName;

        if (tag === "INPUT" || tag === "TEXTAREA" || target.isContentEditable) {
          return;
        }
      }

      event.preventDefault();
      handleUndo();
    }

    function onDeleteKey(event: KeyboardEvent) {
      if (event.key !== "Delete" && event.key !== "Backspace") {
        return;
      }

      const target = event.target;

      if (target instanceof HTMLElement) {
        const tag = target.tagName;

        if (tag === "INPUT" || tag === "TEXTAREA" || target.isContentEditable) {
          return;
        }
      }

      if (builderTool !== "boundary" || selectedVertexIndex === null) {
        return;
      }

      event.preventDefault();
      removeVertexAt(selectedVertexIndex);
    }

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keydown", onDeleteKey);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keydown", onDeleteKey);
    };
  }, [builderTool, handleUndo, isEditing, removeVertexAt, selectedVertexIndex]);

  const shouldOfferTablesModeGuide =
    isEditing &&
    isDndReady &&
    builderTool === "boundary" &&
    !isFloorPlanTablesModeGuideDismissed();

  const shouldOfferTableDragGuide =
    isEditing &&
    isDndReady &&
    builderTool === "tables" &&
    !isFloorPlanTableDragGuideDismissed();

  const { dismissOverlay: dismissTablesModeOverlay } =
    useFloorPlanTablesModeGuide({
      active: shouldOfferTablesModeGuide,
      title: labels.builder.tablesModeGuideTitle,
      description: labels.builder.tablesModeGuideDescription,
      doneText: labels.builder.tablesModeGuideDismiss,
    });

  const { dismissOverlay, dismissGuide } = useFloorPlanTableDragGuide({
    active: shouldOfferTableDragGuide && !isPaletteDragging,
    title: labels.builder.dragGuideTitle,
    description: labels.builder.dragGuideDescription,
    doneText: labels.builder.dragGuideDismiss,
  });

  const tableDragSensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
  );

  useEffect(() => {
    if (!isPaletteDragging) {
      return;
    }

    function trackPointer(event: PointerEvent) {
      pointerRef.current = { x: event.clientX, y: event.clientY };
    }

    window.addEventListener("pointermove", trackPointer);
    return () => window.removeEventListener("pointermove", trackPointer);
  }, [isPaletteDragging]);

  const activeSurface =
    surfaces.find((surface) => surface.id === activeSurfaceId) ??
    surfaces[0] ??
    null;

  const selectedTable = draft.tables.find(
    (table) => table.id === selectedTableId,
  );

  function loadDraftForSurface(surface: DiningSurfaceRecord | null) {
    clearHistory();
    setDraft(draftFromSurface(surface, fallbackSurfaceName));
    setSelectedTableId(null);
    setSelectedVertexIndex(null);
    setBuilderTool(resolveBuilderToolForSurface(surface));
  }

  function selectSurface(surfaceId: string) {
    setActiveSurfaceId(surfaceId);
    const surface = surfaces.find((item) => item.id === surfaceId) ?? null;
    loadDraftForSurface(surface);
  }

  function startNewSurfaceAtFloor(floor: number) {
    clearHistory();
    setDraft({
      surfaceId: undefined,
      name: defaultSurfaceName(floor, labels.builder),
      floor,
      surfaceAreaM2: 45,
      boundary: defaultRectangleBoundary(),
      tables: [],
    });
    setActiveSurfaceId(null);
    setSelectedTableId(null);
  }

  async function handleSave() {
    if (draft.boundary.length < 3) {
      toast.error(labels.builder.minBoundary);
      return;
    }

    setIsSaving(true);

    try {
      const result = await saveFloorPlanAction({
        restaurantId,
        surface: {
          id: draft.surfaceId,
          name: draft.name.trim(),
          floor: draft.floor,
          surfaceAreaM2: draft.surfaceAreaM2,
          boundary: draft.boundary,
        },
        tables: draft.tables.map((table) => ({
          id: table.id,
          number: table.number,
          shape: table.shape,
          capacity: table.capacity,
          positionX: table.positionX,
          positionY: table.positionY,
          rotation: table.rotation,
          width: table.width,
          height: table.height,
        })),
      });

      setSurfaces((current) => {
        const existingIndex = current.findIndex(
          (surface) => surface.id === result.surface.id,
        );

        if (existingIndex >= 0) {
          return current.map((surface, index) =>
            index === existingIndex ? result.surface : surface,
          );
        }

        return [...current, result.surface].sort(
          (left, right) => left.floor - right.floor,
        );
      });
      setActiveSurfaceId(result.surface.id);
      setDraft(draftFromSurface(result.surface, fallbackSurfaceName));
      clearHistory();
      toast.success(labels.feedback.saveSuccess);
    } catch {
      toast.error(labels.feedback.saveError);
    } finally {
      setIsSaving(false);
    }
  }

  function handleAddTableAt(positionX = 0.5, positionY = 0.5) {
    recordCurrentHistory();
    const number = nextTableNumber(draft.tables.map((table) => table.number));
    const table: DiningTableRecord = {
      id: createTableId(),
      number,
      shape: "ROUND",
      capacity: 4,
      positionX: clamp01(positionX),
      positionY: clamp01(positionY),
      rotation: 0,
      width: 0.08,
      height: 0.08,
      sortOrder: draft.tables.length,
    };

    setDraft((current) => ({
      ...current,
      tables: [...current.tables, table],
    }));
    setSelectedTableId(table.id);
    setBuilderTool("tables");
  }

  function addTableAtClientPoint(clientX: number, clientY: number) {
    const rect = canvasDropRef.current?.getBoundingClientRect();

    if (!rect) {
      return;
    }

    handleAddTableAt(
      (clientX - rect.left) / rect.width,
      (clientY - rect.top) / rect.height,
    );
  }

  function getCurrentFloor() {
    if (isEditing) {
      return draft.floor;
    }

    return activeSurface?.floor ?? 1;
  }

  function handleContextAddTable(clientX: number, clientY: number) {
    const placeTable = () => {
      dismissTablesModeOverlay();
      dismissFloorPlanTablesModeGuide();
      setBuilderTool("tables");
      addTableAtClientPoint(clientX, clientY);
    };

    placeTable();
  }

  function navigateFloor(direction: "up" | "down") {
    const currentFloor = getCurrentFloor();

    if (!canEdit) {
      const configuredFloors = [
        ...new Set(surfaces.map((surface) => surface.floor)),
      ].sort((left, right) => left - right);

      if (configuredFloors.length === 0) {
        return;
      }

      const currentIndex = configuredFloors.indexOf(currentFloor);
      let targetFloor: number | undefined;

      if (currentIndex === -1) {
        targetFloor =
          direction === "up"
            ? configuredFloors.find((floor) => floor > currentFloor)
            : [...configuredFloors]
                .reverse()
                .find((floor) => floor < currentFloor);
      } else {
        const targetIndex =
          direction === "up" ? currentIndex + 1 : currentIndex - 1;
        targetFloor = configuredFloors[targetIndex];
      }

      if (targetFloor === undefined) {
        return;
      }

      const existing = surfaces.find(
        (surface) => surface.floor === targetFloor,
      );

      if (existing) {
        selectSurface(existing.id);
      }

      return;
    }

    const targetFloor =
      direction === "up" ? currentFloor + 1 : currentFloor - 1;

    if (
      targetFloor < FLOOR_PLAN_FLOOR_MIN ||
      targetFloor > FLOOR_PLAN_FLOOR_MAX
    ) {
      toast.error(labels.feedback.floorLimit);
      return;
    }

    const existing = surfaces.find((surface) => surface.floor === targetFloor);

    if (existing) {
      selectSurface(existing.id);
      return;
    }

    startNewSurfaceAtFloor(targetFloor);
  }

  const currentFloor = getCurrentFloor();
  const configuredFloors = [
    ...new Set(surfaces.map((surface) => surface.floor)),
  ].sort((left, right) => left - right);
  const configuredFloorIndex = configuredFloors.indexOf(currentFloor);

  const canFloorUp = canEdit
    ? currentFloor < FLOOR_PLAN_FLOOR_MAX
    : configuredFloorIndex >= 0
      ? configuredFloorIndex < configuredFloors.length - 1
      : configuredFloors.some((floor) => floor > currentFloor);
  const canFloorDown = canEdit
    ? currentFloor > FLOOR_PLAN_FLOOR_MIN
    : configuredFloorIndex >= 0
      ? configuredFloorIndex > 0
      : configuredFloors.some((floor) => floor < currentFloor);
  const isUnconfiguredFloor =
    isEditing && !surfaces.some((surface) => surface.floor === currentFloor);

  const floorSwitcherProps = {
    surfaces,
    currentFloor,
    activeSurfaceId: isEditing
      ? (draft.surfaceId ?? activeSurfaceId)
      : (activeSurface?.id ?? null),
    labels: {
      floor: labels.manager.floor,
      floorUp: labels.contextMenu.floorUp,
      floorDown: labels.contextMenu.floorDown,
      switchFloor: labels.manager.switchFloor,
      selectSurface: labels.manager.selectSurface,
      unconfiguredFloor: labels.manager.unconfiguredFloor,
    },
    floorNameLabels: {
      surfaceNameBasement: labels.builder.surfaceNameBasement,
      surfaceNameGround: labels.builder.surfaceNameGround,
      surfaceNameFloor: labels.builder.surfaceNameFloor,
    },
    canFloorUp,
    canFloorDown,
    isUnconfiguredFloor,
    onFloorUp: () => navigateFloor("up"),
    onFloorDown: () => navigateFloor("down"),
    onSelectSurface: (surfaceId: string) => {
      selectSurface(surfaceId);
    },
  };

  const contextMenuProps = {
    labels: labels.contextMenu,
    enabled: canEdit,
    elevated: true,
    tablesModeActive: !isEditing || builderTool === "tables",
    boundaryModeActive: isEditing && builderTool === "boundary",
    canRemoveVertex: selectedVertexIndex !== null,
    canFloorUp,
    canFloorDown,
    onCanvasRef: (node: HTMLDivElement | null) => {
      canvasDropRef.current = node;
    },
    onAddTable: handleContextAddTable,
    onActivateTablesMode: () => {
      dismissTablesModeOverlay();
      dismissFloorPlanTablesModeGuide();
      setBuilderTool("tables");
      setSelectedVertexIndex(null);
    },
    onRemoveVertex: removeSelectedVertex,
    onFloorUp: () => navigateFloor("up"),
    onFloorDown: () => navigateFloor("down"),
  };

  function handlePaletteDragStart(event: DragStartEvent) {
    if (event.active.id !== FLOOR_PLAN_TABLE_PALETTE_ID) {
      return;
    }

    setIsPaletteDragging(true);
    dismissOverlay();

    const activator = event.activatorEvent;

    if (activator instanceof PointerEvent || activator instanceof MouseEvent) {
      pointerRef.current = { x: activator.clientX, y: activator.clientY };
    }
  }

  function handlePaletteDragEnd(event: DragEndEvent) {
    setIsPaletteDragging(false);

    if (event.active.id !== FLOOR_PLAN_TABLE_PALETTE_ID) {
      return;
    }

    if (event.over?.id !== FLOOR_PLAN_CANVAS_DROP_ID) {
      return;
    }

    const rect = canvasDropRef.current?.getBoundingClientRect();

    if (!rect) {
      return;
    }

    const { x, y } = pointerRef.current;
    const positionX = clamp01((x - rect.left) / rect.width);
    const positionY = clamp01((y - rect.top) / rect.height);

    handleAddTableAt(positionX, positionY);
    dismissFloorPlanTableDragGuide();
    dismissGuide();
  }

  function handlePaletteDragCancel() {
    setIsPaletteDragging(false);
  }

  function handleRemoveSelectedTable() {
    if (!selectedTableId) {
      return;
    }

    recordCurrentHistory();

    setDraft((current) => ({
      ...current,
      tables: current.tables.filter((table) => table.id !== selectedTableId),
    }));
    setSelectedTableId(null);
  }

  function updateSelectedTable(patch: Partial<DiningTableRecord>) {
    if (!selectedTableId) {
      return;
    }

    setDraft((current) => ({
      ...current,
      tables: current.tables.map((table) =>
        table.id === selectedTableId ? { ...table, ...patch } : table,
      ),
    }));
  }

  function handleDraftChange(patch: Partial<EditorDraft>) {
    setDraft((current) => ({ ...current, ...patch }));
  }

  const builderPanelProps = {
    draft: {
      name: draft.name,
      floor: draft.floor,
      surfaceAreaM2: draft.surfaceAreaM2,
    },
    builderTool,
    selectedTable: selectedTable ?? null,
    isDndReady,
    canEdit,
    isSaving,
    canCancel: surfaces.length > 0 || Boolean(draft.surfaceId),
    onDraftChange: handleDraftChange,
    onUpdateSelectedTable: updateSelectedTable,
    onRemoveSelectedTable: handleRemoveSelectedTable,
    onBeforeTableChange: recordCurrentHistory,
    onSave: handleSave,
    onCancel: () => {
      loadDraftForSurface(activeSurface);
    },
  };

  const tableQuickControlLabels = {
    tableShapeRound: labels.builder.tableShapeRound,
    tableShapeSquare: labels.builder.tableShapeSquare,
    tableShapeRect: labels.builder.tableShapeRect,
    tableCapacity: labels.builder.tableCapacity,
    previousShape: labels.builder.previousShape,
    nextShape: labels.builder.nextShape,
    decreaseCapacity: labels.builder.decreaseCapacity,
    increaseCapacity: labels.builder.increaseCapacity,
  };

  if (!canEdit && surfaces.length === 0) {
    return (
      <main className="flex flex-col gap-6 p-4 md:p-6">
        <Header labels={labels} />
        <Card>
          <CardHeader>
            <CardTitle>{labels.permissions.deniedTitle}</CardTitle>
            <CardDescription>
              {labels.permissions.deniedDescription}
            </CardDescription>
          </CardHeader>
        </Card>
      </main>
    );
  }

  if (canEdit) {
    const builderGrid = (
      <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_min(320px,32vw)] gap-3">
        <Card className="flex min-h-0 flex-1 flex-col border-0 shadow-none">
          <CardContent className="flex min-h-0 flex-1 flex-col p-0">
            <div
              ref={canvasContainerRef}
              className="relative min-h-0 flex-1"
            >
              <FloorPlanCanvasContextMenu {...contextMenuProps}>
                <FloorPlanCanvasDropZone
                  dndEnabled={isDndReady}
                  disabled={builderTool !== "tables"}
                >
                  <FloorPlanCanvas
                    boundary={draft.boundary}
                    tables={draft.tables}
                    canvasWidth={canvasSize.width}
                    canvasHeight={canvasSize.height}
                    fillContainer
                    focusedTableId={selectedTableId}
                    mode={
                      builderTool === "boundary"
                        ? "builder-boundary"
                        : "builder-tables"
                    }
                    onBoundaryChange={(boundary) =>
                      setDraft((current) => ({ ...current, boundary }))
                    }
                    onTablesChange={(tables) =>
                      setDraft((current) => ({ ...current, tables }))
                    }
                    onBoundaryEditStart={recordCurrentHistory}
                    onTableEditStart={recordCurrentHistory}
                    selectedVertexIndex={selectedVertexIndex}
                    onSelectVertex={setSelectedVertexIndex}
                    onRemoveVertex={removeVertexAt}
                    onFocusTable={(tableId) => {
                      setSelectedTableId(tableId);
                      setSelectedVertexIndex(null);
                    }}
                    onBlurTable={() => setSelectedTableId(null)}
                  />
                </FloorPlanCanvasDropZone>
              </FloorPlanCanvasContextMenu>
              {selectedTable && builderTool === "tables" ? (
                <FloorPlanTableQuickControls
                  table={selectedTable}
                  canvasWidth={canvasSize.width}
                  canvasHeight={canvasSize.height}
                  labels={tableQuickControlLabels}
                  onUpdate={(patch) => {
                    recordCurrentHistory();
                    updateSelectedTable(patch);
                  }}
                />
              ) : null}
            </div>
          </CardContent>
        </Card>

        <div className="min-h-0 space-y-4 overflow-y-auto border-l border-border pl-3">
          <h2 className="px-1 text-sm font-semibold tracking-tight">
            {labels.manager.openSettingsPanel}
          </h2>
          <FloorPlanBuilderPanel
            labels={labels.builder}
            managerLabels={labels.manager}
            {...builderPanelProps}
            showActions={false}
          />
        </div>
      </div>
    );

    return (
      <>
        <main className="flex flex-col gap-6 p-4 md:p-6 xl:hidden">
          <Header labels={labels} />
          <Card>
            <CardHeader>
              <CardTitle>{labels.responsive.largeScreenOnlyTitle}</CardTitle>
              <CardDescription>
                {labels.responsive.largeScreenOnlyDescription}
              </CardDescription>
            </CardHeader>
          </Card>
        </main>
        <main
          className="hidden h-full min-h-0 flex-col gap-3 p-3 md:p-4 xl:flex"
        >
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <FloorPlanFloorSwitcher {...floorSwitcherProps} />
            <Button
              type="button"
              size="sm"
              variant={builderTool === "boundary" ? "default" : "secondary"}
              onClick={() => setBuilderTool("boundary")}
            >
              {labels.builder.toolBoundary}
            </Button>
            <Button
              type="button"
              size="sm"
              variant={builderTool === "tables" ? "default" : "secondary"}
              data-floor-plan-tool-tables
              onClick={() => {
                dismissTablesModeOverlay();
                dismissFloorPlanTablesModeGuide();
                setBuilderTool("tables");
                setSelectedVertexIndex(null);
              }}
            >
              {labels.builder.toolTables}
            </Button>
            {builderTool === "boundary" ? (
              <>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    recordCurrentHistory();
                    setDraft((current) => ({
                      ...current,
                      boundary: defaultRectangleBoundary(),
                    }));
                    setSelectedVertexIndex(null);
                  }}
                >
                  {labels.builder.resetBoundary}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={removeLastVertex}
                  disabled={draft.boundary.length === 0}
                >
                  {labels.builder.undoVertex}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={removeSelectedVertex}
                  disabled={selectedVertexIndex === null}
                >
                  {labels.builder.removeVertex}
                </Button>
              </>
            ) : null}
            <div className="ml-auto flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? labels.builder.saving : labels.builder.save}
              </Button>
              {surfaces.length > 0 || draft.surfaceId ? (
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => loadDraftForSurface(activeSurface)}
                >
                  {labels.builder.cancel}
                </Button>
              ) : null}
            </div>
          </div>
          {isDndReady ? (
            <DndContext
              sensors={tableDragSensors}
              onDragStart={handlePaletteDragStart}
              onDragEnd={handlePaletteDragEnd}
              onDragCancel={handlePaletteDragCancel}
            >
              <div className="flex min-h-0 flex-1 flex-col">
                {builderGrid}
              </div>
              <DragOverlay dropAnimation={{ duration: 180, easing: "ease-out" }}>
                {isPaletteDragging ? <FloorPlanTablePaletteOverlay /> : null}
              </DragOverlay>
            </DndContext>
          ) : (
            <div className="flex min-h-0 flex-1 flex-col">
              {builderGrid}
            </div>
          )}
        </main>
      </>
    );
  }

  return null;
}

function Header({ labels }: { labels: FloorPlanPageClientProps["labels"] }) {
  return (
    <div>
      <h1 className="font-heading text-2xl font-semibold tracking-tight">
        {labels.header.title}
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {labels.header.subtitle}
      </p>
    </div>
  );
}
