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
import { useEffect, useRef, useState, useCallback } from "react";
import { toast } from "sonner";
import { saveFloorPlanAction } from "@/app/actions/floor-plan";
import { useDashboardFocusMode } from "@/components/dashboard/dashboard-focus-mode";
import {
  FLOOR_PLAN_CANVAS_DROP_ID,
  FloorPlanCanvasDropZone,
} from "@/components/dashboard/floor-plan/floor-plan-canvas-drop-zone";
import { FloorPlanBuilderPanel } from "@/components/dashboard/floor-plan/floor-plan-builder-panel";
import { FloorPlanExpandButton } from "@/components/dashboard/floor-plan/floor-plan-expand-button";
import { FloorPlanTableQuickControls } from "@/components/dashboard/floor-plan/floor-plan-table-quick-controls";
import { FloorPlanCanvasContextMenu } from "@/components/dashboard/floor-plan/floor-plan-canvas-context-menu";
import { FloorPlanCanvas } from "@/components/dashboard/floor-plan/floor-plan-canvas-loader";
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
import { cn } from "@/lib/utils";

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

function surfaceTabLabel(surface: DiningSurfaceRecord, floorLabel: string) {
  return `${floorLabel} ${surface.floor} · ${surface.name}`;
}

function draftFromSurface(surface: DiningSurfaceRecord | null): EditorDraft {
  return {
    surfaceId: surface?.id,
    name: surface?.name ?? "Salón principal",
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

export function FloorPlanPageClient({
  labels,
  restaurantId,
  canEdit,
  initialSurfaces,
  occupiedTableNumbers,
}: FloorPlanPageClientProps) {
  const [surfaces, setSurfaces] = useState(initialSurfaces);
  const [activeSurfaceId, setActiveSurfaceId] = useState<string | null>(
    initialSurfaces[0]?.id ?? null,
  );
  const [isEditing, setIsEditing] = useState(
    initialSurfaces.length === 0 && canEdit,
  );
  const [isSaving, setIsSaving] = useState(false);
  const [draft, setDraft] = useState<EditorDraft>(() =>
    draftFromSurface(initialSurfaces[0] ?? null),
  );
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [selectedVertexIndex, setSelectedVertexIndex] = useState<number | null>(
    null,
  );
  const [builderTool, setBuilderTool] = useState<BuilderTool>("boundary");
  const [selectedTableNumber, setSelectedTableNumber] = useState<string | null>(
    null,
  );
  const [isPaletteDragging, setIsPaletteDragging] = useState(false);
  const [isDndReady, setIsDndReady] = useState(false);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const canvasDropRef = useRef<HTMLDivElement | null>(null);
  const pointerRef = useRef({ x: 0, y: 0 });
  const draftRef = useRef(draft);
  const selectedTableIdRef = useRef(selectedTableId);
  const { recordHistory, undo, clearHistory } = useFloorPlanUndo<EditorDraft>();
  const { isFocused, exitFocus } = useDashboardFocusMode();
  const canvasSize = useFloorPlanCanvasSize(canvasContainerRef, isFocused);

  useEffect(() => {
    setIsDndReady(true);
  }, []);

  useEffect(() => {
    return () => {
      exitFocus();
    };
  }, [exitFocus]);

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
      if (!(event.ctrlKey || event.metaKey) || event.key !== "z" || event.shiftKey) {
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

  const { dismissOverlay: dismissTablesModeOverlay, dismissGuide: dismissTablesModeGuide } =
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

  const selectedTable = draft.tables.find((table) => table.id === selectedTableId);

  function loadDraftForSurface(surface: DiningSurfaceRecord | null) {
    clearHistory();
    setDraft(draftFromSurface(surface));
    setSelectedTableId(null);
    setSelectedVertexIndex(null);
    setBuilderTool("boundary");
  }

  function selectSurface(surfaceId: string) {
    setActiveSurfaceId(surfaceId);
    const surface = surfaces.find((item) => item.id === surfaceId) ?? null;
    loadDraftForSurface(surface);
    setSelectedTableNumber(null);
  }

  function startEditing(surface: DiningSurfaceRecord | null) {
    loadDraftForSurface(surface);
    setIsEditing(true);
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
    setIsEditing(true);
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
      setDraft(draftFromSurface(result.surface));
      clearHistory();
      setIsEditing(false);
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

    if (!isEditing) {
      startEditing(activeSurface);
      window.setTimeout(placeTable, 0);
      return;
    }

    placeTable();
  }

  function navigateFloor(direction: "up" | "down") {
    const currentFloor = getCurrentFloor();
    const targetFloor =
      direction === "up" ? currentFloor + 1 : currentFloor - 1;

    if (targetFloor < FLOOR_PLAN_FLOOR_MIN || targetFloor > FLOOR_PLAN_FLOOR_MAX) {
      toast.error(labels.feedback.floorLimit);
      return;
    }

    const existing = surfaces.find((surface) => surface.floor === targetFloor);

    if (existing) {
      selectSurface(existing.id);

      if (isEditing) {
        setIsEditing(true);
      }

      return;
    }

    startNewSurfaceAtFloor(targetFloor);
  }

  const canFloorUp = getCurrentFloor() < FLOOR_PLAN_FLOOR_MAX;
  const canFloorDown = getCurrentFloor() > FLOOR_PLAN_FLOOR_MIN;

  const contextMenuProps = {
    labels: labels.contextMenu,
    enabled: canEdit,
    elevated: isFocused,
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
      setIsEditing(false);
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
            <CardDescription>{labels.permissions.deniedDescription}</CardDescription>
          </CardHeader>
        </Card>
      </main>
    );
  }

  if (isEditing) {
    const builderGrid = (
      <div
        className={cn(
          "min-h-0 gap-6",
          isFocused
            ? "grid flex-1 grid-cols-[minmax(0,1fr)_min(320px,32vw)] gap-3"
            : "grid xl:grid-cols-[minmax(0,1fr)_320px]",
        )}
      >
            <Card
              className={cn(
                isFocused && "flex min-h-0 flex-1 flex-col border-0 shadow-none",
              )}
            >
              <CardHeader className={cn(isFocused && "hidden")}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <CardTitle>{labels.builder.title}</CardTitle>
                    <CardDescription>{labels.builder.description}</CardDescription>
                  </div>
                  <FloorPlanExpandButton
                    expandLabel={labels.manager.expandCanvas}
                    collapseLabel={labels.manager.collapseCanvas}
                  />
                </div>
              </CardHeader>
              <CardContent
                className={cn(
                  "space-y-4",
                  isFocused && "flex min-h-0 flex-1 flex-col p-0",
                )}
              >
                {!isFocused ? (
                  <>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant={builderTool === "boundary" ? "default" : "secondary"}
                    onClick={() => setBuilderTool("boundary")}
                  >
                    {labels.builder.toolBoundary}
                  </Button>
                  <Button
                    type="button"
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
                </div>
                <p className="text-sm text-muted-foreground">
                  {builderTool === "boundary"
                    ? labels.builder.boundaryHint
                    : labels.builder.tablesHint}
                </p>
                {builderTool === "boundary" ? (
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
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
                      variant="secondary"
                      onClick={removeLastVertex}
                      disabled={draft.boundary.length === 0}
                    >
                      {labels.builder.undoVertex}
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={removeSelectedVertex}
                      disabled={selectedVertexIndex === null}
                    >
                      {labels.builder.removeVertex}
                    </Button>
                  </div>
                ) : null}
                  </>
                ) : null}
                <div
                  ref={canvasContainerRef}
                  className={cn(
                    "relative",
                    isFocused ? "min-h-0 flex-1" : undefined,
                  )}
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
                        fillContainer={isFocused}
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

            {!isFocused ? (
              <div className="space-y-4">
                <FloorPlanBuilderPanel
                  labels={labels.builder}
                  managerLabels={labels.manager}
                  {...builderPanelProps}
                />
              </div>
            ) : (
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
            )}
      </div>
    );

    return (
      <main
        className={cn(
          "flex flex-col",
          isFocused ? "h-full min-h-0 gap-3 p-3 md:p-4" : "gap-6 p-4 md:p-6",
        )}
      >
        {!isFocused ? <Header labels={labels} /> : null}
        <div
          className={cn(
            "flex flex-wrap items-center gap-2",
            isFocused ? "shrink-0" : "hidden",
          )}
        >
          <FloorPlanExpandButton
            expandLabel={labels.manager.expandCanvas}
            collapseLabel={labels.manager.collapseCanvas}
          />
          <SurfaceTabs
            surfaces={surfaces}
            activeSurfaceId={draft.surfaceId ?? activeSurfaceId}
            floorLabel={labels.manager.floor}
            onSelect={(surfaceId) => {
              selectSurface(surfaceId);
              setIsEditing(true);
            }}
          />
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
            <Button type="button" size="sm" onClick={handleSave} disabled={isSaving}>
              {isSaving ? labels.builder.saving : labels.builder.save}
            </Button>
            {surfaces.length > 0 || draft.surfaceId ? (
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => {
                  loadDraftForSurface(activeSurface);
                  setIsEditing(false);
                }}
              >
                {labels.builder.cancel}
              </Button>
            ) : null}
          </div>
        </div>
        {!isFocused ? (
          <SurfaceTabs
            surfaces={surfaces}
            activeSurfaceId={draft.surfaceId ?? activeSurfaceId}
            floorLabel={labels.manager.floor}
            onSelect={(surfaceId) => {
              selectSurface(surfaceId);
              setIsEditing(true);
            }}
          />
        ) : null}
        {isDndReady ? (
          <DndContext
            sensors={tableDragSensors}
            onDragStart={handlePaletteDragStart}
            onDragEnd={handlePaletteDragEnd}
            onDragCancel={handlePaletteDragCancel}
          >
            <div className={cn(isFocused && "flex min-h-0 flex-1 flex-col")}>
              {builderGrid}
            </div>
            <DragOverlay dropAnimation={{ duration: 180, easing: "ease-out" }}>
              {isPaletteDragging ? <FloorPlanTablePaletteOverlay /> : null}
            </DragOverlay>
          </DndContext>
        ) : (
          <div className={cn(isFocused && "flex min-h-0 flex-1 flex-col")}>{builderGrid}</div>
        )}
      </main>
    );
  }

  if (surfaces.length === 0) {
    return (
      <main className="flex flex-col gap-6 p-4 md:p-6">
        <Header labels={labels} />
        <Card>
          <CardHeader>
            <CardTitle>{labels.empty.title}</CardTitle>
            <CardDescription>{labels.empty.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button type="button" onClick={() => startEditing(null)}>
              {labels.empty.cta}
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main
      className={cn(
        "flex flex-col",
        isFocused ? "h-full min-h-0 gap-3 p-3 md:p-4" : "gap-6 p-4 md:p-6",
      )}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        {!isFocused ? <Header labels={labels} /> : null}
        <div className="flex flex-wrap gap-2">
          <FloorPlanExpandButton
            expandLabel={labels.manager.expandCanvas}
            collapseLabel={labels.manager.collapseCanvas}
          />
          {canEdit ? (
            <Button
              type="button"
              variant="secondary"
              onClick={() => startEditing(activeSurface)}
            >
              {labels.manager.editLayout}
            </Button>
          ) : null}
        </div>
      </div>

      <SurfaceTabs
        surfaces={surfaces}
        activeSurfaceId={activeSurface?.id ?? null}
        floorLabel={labels.manager.floor}
        onSelect={selectSurface}
      />

      {activeSurface ? (
        isFocused ? (
          <div className="flex min-h-0 flex-1 flex-col gap-3">
            <div className="flex flex-wrap gap-4 text-sm">
              <Legend color="#22c55e" label={labels.manager.legendFree} />
              <Legend color="#f97316" label={labels.manager.legendOccupied} />
              <Legend color="#2563eb" label={labels.manager.legendSelected} />
            </div>
            <div ref={canvasContainerRef} className="relative min-h-0 flex-1">
              <FloorPlanCanvasContextMenu {...contextMenuProps}>
                <FloorPlanCanvas
                  boundary={activeSurface.boundary}
                  tables={activeSurface.tables}
                  occupiedTableNumbers={occupiedTableNumbers}
                  selectedTableNumber={selectedTableNumber}
                  canvasWidth={canvasSize.width}
                  canvasHeight={canvasSize.height}
                  fillContainer
                  mode="view"
                  onSelectTable={setSelectedTableNumber}
                />
              </FloorPlanCanvasContextMenu>
            </div>
            {selectedTableNumber ? (
              <div className="flex shrink-0 flex-wrap items-center gap-3 rounded-3xl border border-border bg-muted/20 p-4">
                <p className="font-medium">
                  {labels.builder.tableNumber}: {selectedTableNumber} · {labels.manager.floor}{" "}
                  {activeSurface.floor}
                </p>
                <Button type="button" asChild>
                  <a
                    href={`/dashboard/orders/new?table=${encodeURIComponent(selectedTableNumber)}`}
                  >
                    {labels.manager.newOrderForTable}
                  </a>
                </Button>
              </div>
            ) : null}
          </div>
        ) : (
        <Card>
          <CardHeader>
            <CardTitle>{activeSurface.name}</CardTitle>
            <CardDescription>
              {labels.manager.floor} {activeSurface.floor} · {labels.manager.surfaceArea}:{" "}
              {activeSurface.surfaceAreaM2.toFixed(1)} m² · {labels.manager.tableCount}:{" "}
              {activeSurface.tables.length}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-4 text-sm">
              <Legend color="#22c55e" label={labels.manager.legendFree} />
              <Legend color="#f97316" label={labels.manager.legendOccupied} />
              <Legend color="#2563eb" label={labels.manager.legendSelected} />
            </div>
            <FloorPlanCanvasContextMenu {...contextMenuProps}>
              <FloorPlanCanvas
                boundary={activeSurface.boundary}
                tables={activeSurface.tables}
                occupiedTableNumbers={occupiedTableNumbers}
                selectedTableNumber={selectedTableNumber}
                canvasWidth={canvasSize.width}
                canvasHeight={canvasSize.height}
                mode="view"
                onSelectTable={setSelectedTableNumber}
              />
            </FloorPlanCanvasContextMenu>
            {selectedTableNumber ? (
              <div className="flex flex-wrap items-center gap-3 rounded-3xl border border-border bg-muted/20 p-4">
                <p className="font-medium">
                  {labels.builder.tableNumber}: {selectedTableNumber} · {labels.manager.floor}{" "}
                  {activeSurface.floor}
                </p>
                <Button type="button" asChild>
                  <a
                    href={`/dashboard/orders/new?table=${encodeURIComponent(selectedTableNumber)}`}
                  >
                    {labels.manager.newOrderForTable}
                  </a>
                </Button>
              </div>
            ) : null}
          </CardContent>
        </Card>
        )
      ) : null}
    </main>
  );
}

function SurfaceTabs({
  surfaces,
  activeSurfaceId,
  floorLabel,
  onSelect,
}: {
  surfaces: DiningSurfaceRecord[];
  activeSurfaceId: string | null;
  floorLabel: string;
  onSelect: (surfaceId: string) => void;
}) {
  if (surfaces.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {surfaces.map((surface) => (
        <Button
          key={surface.id}
          type="button"
          size="sm"
          variant={surface.id === activeSurfaceId ? "default" : "secondary"}
          className={cn(surface.id === activeSurfaceId && "shadow-sm")}
          onClick={() => onSelect(surface.id)}
        >
          {surfaceTabLabel(surface, floorLabel)}
        </Button>
      ))}
    </div>
  );
}

function Header({ labels }: { labels: FloorPlanPageClientProps["labels"] }) {
  return (
    <div>
      <h1 className="font-heading text-2xl font-semibold tracking-tight">
        {labels.header.title}
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">{labels.header.subtitle}</p>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span
        className="size-3 rounded-full"
        style={{ backgroundColor: color }}
        aria-hidden
      />
      {label}
    </span>
  );
}
