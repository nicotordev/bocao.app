"use client";

import { useCallback, useRef } from "react";

const MAX_HISTORY = 50;

export type FloorPlanHistorySnapshot<TDraft> = {
  draft: TDraft;
  selectedTableId: string | null;
};

export function useFloorPlanUndo<TDraft>() {
  const historyRef = useRef<FloorPlanHistorySnapshot<TDraft>[]>([]);

  const recordHistory = useCallback(
    (draft: TDraft, selectedTableId: string | null) => {
      historyRef.current.push(
        structuredClone({
          draft,
          selectedTableId,
        }),
      );

      if (historyRef.current.length > MAX_HISTORY) {
        historyRef.current.shift();
      }
    },
    [],
  );

  const undo = useCallback(() => {
    return historyRef.current.pop() ?? null;
  }, []);

  const clearHistory = useCallback(() => {
    historyRef.current = [];
  }, []);

  const canUndo = useCallback(() => historyRef.current.length > 0, []);

  return {
    recordHistory,
    undo,
    clearHistory,
    canUndo,
  };
}
