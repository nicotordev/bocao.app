export type NormalizedPoint = {
  x: number;
  y: number;
};

export type DiningTableShape = "ROUND" | "SQUARE" | "RECT";

export type DiningTableRecord = {
  id: string;
  number: string;
  shape: DiningTableShape;
  capacity: number;
  positionX: number;
  positionY: number;
  rotation: number;
  width: number;
  height: number;
  sortOrder: number;
};

export type DiningSurfaceRecord = {
  id: string;
  restaurantId: string;
  name: string;
  floor: number;
  surfaceAreaM2: number;
  boundary: NormalizedPoint[];
  sortOrder: number;
  tables: DiningTableRecord[];
};

export type FloorPlanRecord = {
  surfaces: DiningSurfaceRecord[];
};

export type TableOccupancy = Record<string, boolean>;

export const FLOOR_PLAN_CANVAS = {
  width: 920,
  height: 560,
};

export const FLOOR_PLAN_FLOOR_MIN = -5;
export const FLOOR_PLAN_FLOOR_MAX = 99;
