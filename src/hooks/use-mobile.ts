import * as React from "react";

const MOBILE_BREAKPOINT = 768;

function subscribeToMobileChanges(onStoreChange: () => void) {
  const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
  mql.addEventListener("change", onStoreChange);
  return () => mql.removeEventListener("change", onStoreChange);
}

function getIsMobileSnapshot() {
  return window.innerWidth < MOBILE_BREAKPOINT;
}

export function useIsMobile() {
  return React.useSyncExternalStore(
    subscribeToMobileChanges,
    getIsMobileSnapshot,
    () => false,
  );
}
