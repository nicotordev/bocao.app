export const FLOOR_PLAN_TABLES_MODE_GUIDE_STORAGE_KEY =
  "bocao.floor-plan.tables-mode-guide.dismissed";

export const FLOOR_PLAN_TABLE_DRAG_GUIDE_STORAGE_KEY =
  "bocao.floor-plan.table-drag-guide.dismissed";

export function isFloorPlanTablesModeGuideDismissed(): boolean {
  try {
    return localStorage.getItem(FLOOR_PLAN_TABLES_MODE_GUIDE_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function dismissFloorPlanTablesModeGuide(): void {
  try {
    localStorage.setItem(FLOOR_PLAN_TABLES_MODE_GUIDE_STORAGE_KEY, "1");
  } catch {
    // ignore storage errors
  }
}

export function isFloorPlanTableDragGuideDismissed(): boolean {
  try {
    return localStorage.getItem(FLOOR_PLAN_TABLE_DRAG_GUIDE_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function dismissFloorPlanTableDragGuide(): void {
  try {
    localStorage.setItem(FLOOR_PLAN_TABLE_DRAG_GUIDE_STORAGE_KEY, "1");
  } catch {
    // ignore storage errors
  }
}
