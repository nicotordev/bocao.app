"use client";

import type Konva from "konva";
import { Circle, Group, Layer, Line, Stage } from "react-konva";
import type { DiningTableRecord, NormalizedPoint } from "@/lib/floor-plan/types";
import { FLOOR_PLAN_CANVAS } from "@/lib/floor-plan/types";
import {
  boundaryToFlatPoints,
  clamp01,
  toCanvasPoint,
  toNormalizedPoint,
} from "@/lib/floor-plan/geometry";
import { TableMarker } from "./table-marker";

export type FloorPlanCanvasMode =
  | "builder-boundary"
  | "builder-tables"
  | "view"
  | "picker";

type FloorPlanCanvasProps = {
  boundary: NormalizedPoint[];
  tables: DiningTableRecord[];
  occupiedTableNumbers?: Record<string, boolean>;
  selectedTableNumber?: string | null;
  focusedTableId?: string | null;
  mode: FloorPlanCanvasMode;
  canvasWidth?: number;
  canvasHeight?: number;
  onBoundaryChange?: (boundary: NormalizedPoint[]) => void;
  onTablesChange?: (tables: DiningTableRecord[]) => void;
  onSelectTable?: (tableNumber: string) => void;
  onFocusTable?: (tableId: string) => void;
  onBlurTable?: () => void;
  onBoundaryEditStart?: () => void;
  onTableEditStart?: () => void;
  selectedVertexIndex?: number | null;
  onSelectVertex?: (index: number | null) => void;
  onRemoveVertex?: (index: number) => void;
};

export function FloorPlanCanvas({
  boundary,
  tables,
  occupiedTableNumbers = {},
  selectedTableNumber = null,
  focusedTableId = null,
  mode,
  canvasWidth = FLOOR_PLAN_CANVAS.width,
  canvasHeight = FLOOR_PLAN_CANVAS.height,
  onBoundaryChange,
  onTablesChange,
  onSelectTable,
  onFocusTable,
  onBlurTable,
  onBoundaryEditStart,
  onTableEditStart,
  selectedVertexIndex = null,
  onSelectVertex,
  onRemoveVertex,
}: FloorPlanCanvasProps) {
  const width = canvasWidth;
  const height = canvasHeight;
  const canEditBoundary = mode === "builder-boundary";
  const canEditTables = mode === "builder-tables";

  function handleStageClick(event: Konva.KonvaEventObject<MouseEvent | TouchEvent>) {
    const nativeEvent = event.evt;

    if (nativeEvent instanceof MouseEvent && nativeEvent.button !== 0) {
      return;
    }

    const stage = event.target.getStage();

    if (!stage) {
      return;
    }

    const target = event.target;

    if (canEditTables) {
      const clickedTable = target.findAncestor(
        (node: Konva.Node) => node.name() === "floor-plan-table",
      );

      if (!clickedTable) {
        onBlurTable?.();
      }

      return;
    }

    if (!canEditBoundary || !onBoundaryChange) {
      return;
    }

    if (target !== stage) {
      return;
    }

    const pointer = stage.getPointerPosition();

    if (!pointer) {
      return;
    }

    onBoundaryEditStart?.();
    onSelectVertex?.(null);

    onBoundaryChange([
      ...boundary,
      toNormalizedPoint(pointer.x, pointer.y, width, height),
    ]);
  }

  function updateVertex(index: number, x: number, y: number) {
    if (!onBoundaryChange) {
      return;
    }

    const next = boundary.map((point, pointIndex) =>
      pointIndex === index
        ? toNormalizedPoint(x, y, width, height)
        : point,
    );

    onBoundaryChange(next);
  }

  function updateTablePosition(tableId: string, x: number, y: number) {
    if (!onTablesChange) {
      return;
    }

    onTablesChange(
      tables.map((table) =>
        table.id === tableId
          ? {
              ...table,
              positionX: clamp01(x / width),
              positionY: clamp01(y / height),
            }
          : table,
      ),
    );
  }

  function handleTableSelect(tableId: string, tableNumber: string) {
    if (canEditTables) {
      onFocusTable?.(tableId);
      return;
    }

    onSelectTable?.(tableNumber);
  }

  return (
    <Stage
      width={width}
      height={height}
      className="rounded-3xl border border-border bg-muted/20 shadow-inner"
      onClick={handleStageClick}
      onTap={handleStageClick}
      onContextMenu={(event) => {
        event.evt.preventDefault();
        event.evt.stopPropagation();
      }}
    >
      <Layer>
        {boundary.length >= 3 ? (
          <Line
            points={boundaryToFlatPoints(boundary, width, height)}
            closed
            fill="rgba(148, 163, 184, 0.18)"
            stroke="rgba(71, 85, 105, 0.8)"
            strokeWidth={2}
          />
        ) : null}

        {tables.map((table) => {
          const canvasPoint = toCanvasPoint(
            { x: table.positionX, y: table.positionY },
            width,
            height,
          );
          const tableWidth = table.width * width;
          const tableHeight = table.height * height;
          const isOccupied = occupiedTableNumbers[table.number] ?? false;
          const isSelected =
            selectedTableNumber === table.number ||
            (canEditTables && focusedTableId === table.id);

          const fill = isSelected
            ? "#2563eb"
            : isOccupied
              ? "#f97316"
              : "#22c55e";

          return (
            <Group
              key={table.id}
              name="floor-plan-table"
              x={canvasPoint.x}
              y={canvasPoint.y}
              rotation={table.rotation}
              draggable={canEditTables}
              onDragStart={() => {
                onTableEditStart?.();
              }}
              onDragEnd={(event) => {
                updateTablePosition(table.id, event.target.x(), event.target.y());
              }}
              onClick={(event) => {
                event.cancelBubble = true;
                handleTableSelect(table.id, table.number);
              }}
              onTap={(event) => {
                event.cancelBubble = true;
                handleTableSelect(table.id, table.number);
              }}
            >
              <TableMarker
                shape={table.shape}
                width={tableWidth}
                height={tableHeight}
                fill={fill}
                number={table.number}
              />
            </Group>
          );
        })}

        {canEditBoundary
          ? boundary.map((point, index) => {
              const canvasPoint = toCanvasPoint(point, width, height);
              const isSelected = selectedVertexIndex === index;

              return (
                <Circle
                  key={`vertex-${index}`}
                  x={canvasPoint.x}
                  y={canvasPoint.y}
                  radius={isSelected ? 10 : 8}
                  fill={isSelected ? "#f97316" : "#2563eb"}
                  stroke="#ffffff"
                  strokeWidth={2}
                  draggable
                  onDragStart={() => {
                    onBoundaryEditStart?.();
                  }}
                  onDragMove={(event) => {
                    updateVertex(index, event.target.x(), event.target.y());
                  }}
                  onClick={(event) => {
                    event.cancelBubble = true;
                    onSelectVertex?.(index);
                  }}
                  onTap={(event) => {
                    event.cancelBubble = true;
                    onSelectVertex?.(index);
                  }}
                  onDblClick={(event) => {
                    event.cancelBubble = true;
                    onRemoveVertex?.(index);
                  }}
                />
              );
            })
          : null}
      </Layer>
    </Stage>
  );
}
