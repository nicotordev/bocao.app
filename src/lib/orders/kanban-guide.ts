export const KANBAN_DRAG_GUIDE_STORAGE_KEY =
  "bocao.orders.kanban-drag-guide.dismissed";

export function isKanbanDragGuideDismissed(): boolean {
  try {
    return localStorage.getItem(KANBAN_DRAG_GUIDE_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function dismissKanbanDragGuide(): void {
  try {
    localStorage.setItem(KANBAN_DRAG_GUIDE_STORAGE_KEY, "1");
  } catch {
    // ignore storage errors
  }
}
