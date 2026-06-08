"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

type DashboardFocusModeContextValue = {
  isFocused: boolean;
  enterFocus: () => void;
  exitFocus: () => void;
};

const DashboardFocusModeContext =
  createContext<DashboardFocusModeContextValue | null>(null);

export function DashboardFocusModeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isFocused, setIsFocused] = useState(false);

  const enterFocus = useCallback(() => {
    setIsFocused(true);
  }, []);

  const exitFocus = useCallback(() => {
    setIsFocused(false);
  }, []);

  useEffect(() => {
    if (!isFocused) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        exitFocus();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [exitFocus, isFocused]);

  const value = useMemo(
    () => ({
      isFocused,
      enterFocus,
      exitFocus,
    }),
    [enterFocus, exitFocus, isFocused],
  );

  return (
    <DashboardFocusModeContext.Provider value={value}>
      {children}
    </DashboardFocusModeContext.Provider>
  );
}

export function useDashboardFocusMode() {
  const context = useContext(DashboardFocusModeContext);

  return (
    context ?? {
      isFocused: false,
      enterFocus: () => {},
      exitFocus: () => {},
    }
  );
}
