import { z } from "zod";

import {
  FLOOR_PLAN_FLOOR_MAX,
  FLOOR_PLAN_FLOOR_MIN,
} from "@/lib/floor-plan/types";

const normalizedPointSchema = z.object({
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
});

const diningTableShapeSchema = z.enum(["ROUND", "SQUARE", "RECT"]);

export const diningTableInputSchema = z.object({
  id: z.string().optional(),
  number: z.string().trim().min(1).max(16),
  shape: diningTableShapeSchema,
  capacity: z.number().int().min(1).max(99),
  positionX: z.number().min(0).max(1),
  positionY: z.number().min(0).max(1),
  rotation: z.number().min(-180).max(180),
  width: z.number().min(0.03).max(0.35),
  height: z.number().min(0.03).max(0.35),
});

export const saveFloorPlanSchema = z.object({
  restaurantId: z.string().min(1),
  surface: z.object({
    id: z.string().optional(),
    name: z.string().trim().min(1).max(80),
    floor: z.number().int().min(FLOOR_PLAN_FLOOR_MIN).max(FLOOR_PLAN_FLOOR_MAX),
    surfaceAreaM2: z.number().positive().max(10000),
    boundary: z.array(normalizedPointSchema).min(3).max(32),
  }),
  tables: z.array(diningTableInputSchema).max(120),
});

export type SaveFloorPlanInput = z.infer<typeof saveFloorPlanSchema>;
