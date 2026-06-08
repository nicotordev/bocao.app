import type { DiningTableShape, NormalizedPoint } from "@/lib/floor-plan/types";
import { FLOOR_PLAN_CANVAS } from "@/lib/floor-plan/types";

export function defaultRectangleBoundary(): NormalizedPoint[] {
  return [
    { x: 0.08, y: 0.12 },
    { x: 0.92, y: 0.12 },
    { x: 0.92, y: 0.88 },
    { x: 0.08, y: 0.88 },
  ];
}

export function polygonArea(points: NormalizedPoint[]): number {
  if (points.length < 3) {
    return 0;
  }

  let area = 0;

  for (let index = 0; index < points.length; index += 1) {
    const current = points[index]!;
    const next = points[(index + 1) % points.length]!;
    area += current.x * next.y - next.x * current.y;
  }

  return Math.abs(area) / 2;
}

export function estimatedRealWorldSideMeters(
  points: NormalizedPoint[],
  surfaceAreaM2: number,
): number {
  const normalizedArea = polygonArea(points);

  if (normalizedArea <= 0 || surfaceAreaM2 <= 0) {
    return 0;
  }

  const scale = Math.sqrt(surfaceAreaM2 / normalizedArea);
  const maxSide = Math.max(
    ...points.map((point) => Math.max(point.x, point.y)),
  );

  return maxSide * FLOOR_PLAN_CANVAS.width * scale;
}

export function toCanvasPoint(
  point: NormalizedPoint,
  width: number = FLOOR_PLAN_CANVAS.width,
  height: number = FLOOR_PLAN_CANVAS.height,
) {
  return {
    x: point.x * width,
    y: point.y * height,
  };
}

export function toNormalizedPoint(
  x: number,
  y: number,
  width: number = FLOOR_PLAN_CANVAS.width,
  height: number = FLOOR_PLAN_CANVAS.height,
): NormalizedPoint {
  return {
    x: clamp01(x / width),
    y: clamp01(y / height),
  };
}

export function boundaryToFlatPoints(
  points: NormalizedPoint[],
  width: number = FLOOR_PLAN_CANVAS.width,
  height: number = FLOOR_PLAN_CANVAS.height,
): number[] {
  return points.flatMap((point) => {
    const canvasPoint = toCanvasPoint(point, width, height);
    return [canvasPoint.x, canvasPoint.y];
  });
}

export function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}

export function nextTableNumber(existingNumbers: string[]): string {
  const numeric = existingNumbers
    .map((value) => Number.parseInt(value, 10))
    .filter((value) => !Number.isNaN(value));

  const next = numeric.length > 0 ? Math.max(...numeric) + 1 : 1;
  return String(next);
}

export const DINING_TABLE_SHAPES: DiningTableShape[] = [
  "ROUND",
  "SQUARE",
  "RECT",
];

export function cycleTableShape(
  shape: DiningTableShape,
  direction: -1 | 1,
): DiningTableShape {
  const index = DINING_TABLE_SHAPES.indexOf(shape);
  const nextIndex =
    (index + direction + DINING_TABLE_SHAPES.length) %
    DINING_TABLE_SHAPES.length;

  return DINING_TABLE_SHAPES[nextIndex] ?? "ROUND";
}

export function tableShapeDimensions(shape: DiningTableShape) {
  if (shape === "RECT") {
    return { width: 0.12, height: 0.07 };
  }

  return { width: 0.08, height: 0.08 };
}

export function clampTableCapacity(capacity: number) {
  return Math.min(99, Math.max(1, capacity));
}
